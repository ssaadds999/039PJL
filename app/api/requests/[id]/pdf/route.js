import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

/* ===== แปลงวันที่ภาษาไทย ===== */
function formatThaiDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function GET(req, context) {
  try {
    const { id } = await context.params;

    /* ===== ดึงข้อมูล request ===== */
    const { data: requestData, error: requestError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("requestId", Number(id))
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    if (requestData.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "ยังไม่อนุมัติ" },
        { status: 403 }
      );
    }

    /* ===== ดึงชื่อผู้ยื่น ===== */
    let submitterName = "ไม่ทราบชื่อ";
    if (requestData.submitterId) {
      const { data: userData } = await supabase
        .from("users")
        .select("fullName")
        .eq("userId", requestData.submitterId)
        .single();
      if (userData?.fullName) submitterName = userData.fullName;
    }

    /* ===== parse items ===== */
    let items = [];
    if (requestData.itemsJson) {
      try {
        const parsed =
          typeof requestData.itemsJson === "string"
            ? JSON.parse(requestData.itemsJson)
            : requestData.itemsJson;
        items = Array.isArray(parsed) ? parsed : [];
      } catch {
        items = [];
      }
    }
    if (items.length === 0) {
      items = [{
        name:      requestData.itemName  || "-",
        quantity:  requestData.quantity  || 1,
        unitPrice: requestData.unitPrice || 0,
      }];
    }

    /* ===== โหลด font จาก public/fonts (TTF มี Thai+Latin ครบ) ===== */
    const fontDir         = path.join(process.cwd(), "public", "fonts");
    const fontNormalBytes = fs.readFileSync(path.join(fontDir, "Sarabun-Regular.ttf"));
    const fontBoldBytes   = fs.readFileSync(path.join(fontDir, "Sarabun-Bold.ttf"));

    /* ===== สร้าง PDF ===== */
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontNormal = await pdfDoc.embedFont(fontNormalBytes);
    const fontBold   = await pdfDoc.embedFont(fontBoldBytes);

    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const black = rgb(0,    0,    0);
    const gray  = rgb(0.4,  0.4,  0.4);
    const white = rgb(1,    1,    1);
    const navy  = rgb(0.1,  0.2,  0.5);
    const light = rgb(0.93, 0.95, 0.98);

    const requestType = requestData.requestType === "purchase" ? "จัดซื้อ" : "จัดจ้าง";

    let y = height - 50;

    /* ── header bar ── */
    page.drawRectangle({ x: 0, y: y - 10, width, height: 60, color: navy });
    page.drawText("PROGRESS C & E", {
      x: 40, y: y + 20, size: 20, font: fontBold, color: white,
    });
    page.drawText(`แบบฟอร์มคำขอ${requestType}`, {
      x: 40, y: y, size: 12, font: fontNormal, color: rgb(0.8, 0.85, 1),
    });

    y -= 50;

    /* ── info box ── */
    page.drawRectangle({ x: 30, y: y - 90, width: width - 60, height: 95, color: light });
    page.drawRectangle({ x: 30, y: y - 90, width: width - 60, height: 95,
      borderColor: rgb(0.75, 0.8, 0.9), borderWidth: 0.5 });

    const col1 = 45;
    const col2 = width / 2 + 20;

    const drawInfo = (label, value, x, yy) => {
      page.drawText(label, { x, y: yy,       size: 9,  font: fontBold,   color: gray  });
      page.drawText(String(value || "-"), { x, y: yy - 14, size: 11, font: fontNormal, color: black });
    };

    drawInfo("เลขที่คำขอ",  `REQ-${requestData.requestId}`,            col1, y - 10);
    drawInfo("ผู้ยื่นคำขอ",  submitterName,                             col1, y - 45);
    drawInfo("ประเภท",       requestType,                               col2, y - 10);
    drawInfo("วันที่ยื่น",   formatThaiDate(requestData.submittedDate), col2, y - 45);

    y -= 110;

    /* ── table header ── */
    const colX    = [40, 200, 330, 415, 505];
    const headers = ["#", "รายการ", "จำนวน", "ราคา/หน่วย", "รวม"];

    page.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 22, color: navy });
    headers.forEach((h, i) => {
      page.drawText(h, { x: colX[i], y: y + 2, size: 9, font: fontBold, color: white });
    });

    y -= 6;

    /* ── rows ── */
    let grandTotal = 0;
    items.forEach((item, idx) => {
      const rowH      = 22;
      const qty       = Number(item.quantity  || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const subtotal  = qty * unitPrice;
      grandTotal     += subtotal;

      const rowBg = idx % 2 === 0 ? white : light;
      page.drawRectangle({ x: 30, y: y - rowH, width: width - 60, height: rowH, color: rowBg });
      page.drawRectangle({ x: 30, y: y - rowH, width: width - 60, height: rowH,
        borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 0.3 });

      const name     = String(item.name || "-");
      const truncate = (s, n) => s.length > n ? s.slice(0, n) + "..." : s;

      page.drawText(String(idx + 1),    { x: colX[0], y: y - 15, size: 10, font: fontNormal, color: black });
      page.drawText(truncate(name, 22), { x: colX[1], y: y - 15, size: 10, font: fontNormal, color: black });
      page.drawText(String(qty),        { x: colX[2], y: y - 15, size: 10, font: fontNormal, color: black });
      page.drawText(
        unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        { x: colX[3], y: y - 15, size: 10, font: fontNormal, color: black }
      );
      page.drawText(
        subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        { x: colX[4], y: y - 15, size: 10, font: fontNormal, color: black }
      );

      y -= rowH;
    });

    /* ── total row ── */
    y -= 4;
    page.drawRectangle({ x: 30, y: y - 24, width: width - 60, height: 24, color: navy });
    page.drawText("ยอดรวมทั้งสิ้น", {
      x: colX[3] - 70, y: y - 16, size: 10, font: fontBold, color: white,
    });
    page.drawText(
      grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
      { x: colX[4], y: y - 16, size: 10, font: fontBold, color: white }
    );

    y -= 50;

    /* ── signature boxes ── */
    const sigY = y - 80;

    const drawSigBox = async (label, name, date, sig, x) => {
      page.drawRectangle({
        x, y: sigY, width: 180, height: 80,
        borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
      });

      // embed ลายเซ็น image
      if (sig && sig.includes("base64,")) {
        try {
          const imgBytes = Buffer.from(sig.split("base64,")[1], "base64");
          const img = sig.includes("image/png")
            ? await pdfDoc.embedPng(imgBytes)
            : await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x: x + 10, y: sigY + 10, width: 160, height: 65 });
        } catch (e) {
          console.error("Signature embed error:", e);
        }
      }

      page.drawText(label, { x: x + 10, y: sigY - 14, size: 9, font: fontBold,   color: gray  });
      if (name) page.drawText(name, { x: x + 10, y: sigY - 26, size: 9, font: fontNormal, color: black });
      page.drawText(date,  { x: x + 10, y: sigY - 38, size: 9, font: fontNormal, color: gray  });
    };

    await drawSigBox(
      "ผู้ยื่นคำขอ", submitterName,
      formatThaiDate(requestData.submittedDate),
      requestData.signature, 60
    );
    await drawSigBox(
      "ผู้อนุมัติ", "",
      formatThaiDate(requestData.approvedAt),
      requestData.managerSignature, width - 240
    );

    /* ── footer ── */
    page.drawLine({
      start: { x: 30, y: 40 }, end: { x: width - 30, y: 40 },
      thickness: 0.5, color: rgb(0.75, 0.78, 0.85),
    });
    page.drawText("PROGRESS C & E  |  ระบบจัดการเอกสาร", {
      x: 30, y: 26, size: 8, font: fontNormal, color: gray,
    });
    page.drawText(`สร้างเมื่อ: ${formatThaiDate(new Date().toISOString())}`, {
      x: width - 160, y: 26, size: 8, font: fontNormal, color: gray,
    });

    /* ===== export ===== */
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="request-${id}.pdf"`,
      },
    });

  } catch (err) {
    console.error("PDF error:", err);
    return NextResponse.json(
      { success: false, message: "PDF error" },
      { status: 500 }
    );
  }
}