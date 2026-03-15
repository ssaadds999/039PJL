import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/* ===== helper: แปลงวันที่เป็นภาษาไทย ===== */
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

/* ===== helper: วาดข้อความ (pdf-lib ใช้ font latin เท่านั้น ภาษาไทยต้อง embed font) ===== */
/* เนื่องจาก Vercel ไม่มี font ไทย เราจะ transliterate ข้อมูลสำคัญเป็น latin
   และใช้ภาษาไทยเฉพาะส่วนที่ฝัง font ไทยได้ */

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
    let submitterName = "N/A";
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
      items = [
        {
          name: requestData.itemName || "-",
          quantity: requestData.quantity || 1,
          unitPrice: requestData.unitPrice || 0,
        },
      ];
    }

    const requestType =
      requestData.requestType === "purchase" ? "Purchase" : "Hire";
    const totalAmount = Number(requestData.totalAmount || 0);

    /* ===== สร้าง PDF ===== */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const black  = rgb(0, 0, 0);
    const gray   = rgb(0.4, 0.4, 0.4);
    const white  = rgb(1, 1, 1);
    const navy   = rgb(0.1, 0.2, 0.5);
    const light  = rgb(0.93, 0.95, 0.98);

    let y = height - 50;

    /* ── header bar ── */
    page.drawRectangle({ x: 0, y: y - 10, width, height: 60, color: navy });
    page.drawText("PROGRESS C & E", {
      x: 40, y: y + 20,
      size: 20, font: fontBold, color: white,
    });
    page.drawText(`Request Form - ${requestType}`, {
      x: 40, y: y,
      size: 11, font: fontNormal, color: rgb(0.8, 0.85, 1),
    });

    y -= 50;

    /* ── info box ── */
    page.drawRectangle({ x: 30, y: y - 90, width: width - 60, height: 95, color: light });
    page.drawRectangle({ x: 30, y: y - 90, width: width - 60, height: 95,
      borderColor: rgb(0.75, 0.8, 0.9), borderWidth: 0.5 });

    const infoLeft  = 45;
    const infoRight = width / 2 + 20;

    const drawInfo = (label, value, x, yy) => {
      page.drawText(label, { x, y: yy, size: 9, font: fontBold,   color: gray  });
      page.drawText(String(value || "-"), { x, y: yy - 13, size: 11, font: fontNormal, color: black });
    };

    drawInfo("Request No.",       `REQ-${requestData.requestId}`,          infoLeft,  y - 10);
    drawInfo("Submitted By",      submitterName,                            infoLeft,  y - 45);
    drawInfo("Type",              requestType,                              infoRight, y - 10);
    drawInfo("Date",              formatThaiDate(requestData.submittedDate),infoRight, y - 45);

    y -= 110;

    /* ── items table header ── */
    const colX   = [40, 210, 340, 420, 510];
    const colW   = [170, 130, 80, 90, 65];
    const headers = ["Item", "Description", "Qty", "Unit Price", "Total"];

    page.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 22, color: navy });
    headers.forEach((h, i) => {
      page.drawText(h, {
        x: colX[i], y: y + 2,
        size: 9, font: fontBold, color: white,
      });
    });

    y -= 6;

    /* ── items rows ── */
    items.forEach((item, idx) => {
      const rowH = 22;
      const rowBg = idx % 2 === 0 ? white : light;

      page.drawRectangle({ x: 30, y: y - rowH, width: width - 60, height: rowH, color: rowBg });
      page.drawRectangle({ x: 30, y: y - rowH, width: width - 60, height: rowH,
        borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 0.3 });

      const qty       = Number(item.quantity  || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const subtotal  = qty * unitPrice;
      const name      = String(item.name || "-");

      /* ตัดชื่อถ้ายาวเกิน */
      const truncate = (str, max) => str.length > max ? str.slice(0, max) + "..." : str;

      page.drawText(String(idx + 1), {
        x: colX[0], y: y - 15, size: 10, font: fontNormal, color: black,
      });
      page.drawText(truncate(name, 28), {
        x: colX[0] + 20, y: y - 15, size: 10, font: fontNormal, color: black,
      });
      page.drawText(String(qty), {
        x: colX[2], y: y - 15, size: 10, font: fontNormal, color: black,
      });
      page.drawText(unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }), {
        x: colX[3], y: y - 15, size: 10, font: fontNormal, color: black,
      });
      page.drawText(subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 }), {
        x: colX[4], y: y - 15, size: 10, font: fontNormal, color: black,
      });

      y -= rowH;
    });

    /* ── total row ── */
    y -= 4;
    page.drawRectangle({ x: 30, y: y - 24, width: width - 60, height: 24, color: navy });
    page.drawText("TOTAL", {
      x: colX[3], y: y - 16, size: 10, font: fontBold, color: white,
    });
    page.drawText(
      totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      { x: colX[4], y: y - 16, size: 10, font: fontBold, color: white }
    );

    y -= 50;

    /* ── signatures ── */
    const sigY = y - 80;

    /* กรอบลายเซ็นผู้ยื่น */
    page.drawRectangle({ x: 60, y: sigY, width: 180, height: 80,
      borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
    page.drawText("Requester Signature", {
      x: 80, y: sigY - 14, size: 9, font: fontBold, color: gray,
    });
    page.drawText(submitterName, {
      x: 80, y: sigY - 26, size: 9, font: fontNormal, color: black,
    });
    page.drawText(formatThaiDate(requestData.submittedDate), {
      x: 80, y: sigY - 38, size: 9, font: fontNormal, color: gray,
    });

    /* กรอบลายเซ็นผู้อนุมัติ */
    page.drawRectangle({ x: width - 240, y: sigY, width: 180, height: 80,
      borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
    page.drawText("Approver Signature", {
      x: width - 220, y: sigY - 14, size: 9, font: fontBold, color: gray,
    });
    page.drawText(formatThaiDate(requestData.approvedAt), {
      x: width - 220, y: sigY - 26, size: 9, font: fontNormal, color: gray,
    });

    /* embed signature images ถ้ามี */
    const embedSign = async (b64, x, y, w, h) => {
      if (!b64 || !b64.includes("base64,")) return;
      try {
        const base64Data = b64.split("base64,")[1];
        const imgBytes   = Buffer.from(base64Data, "base64");
        let   img;
        if (b64.includes("image/png") || b64.startsWith("data:image/png")) {
          img = await pdfDoc.embedPng(imgBytes);
        } else {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        page.drawImage(img, { x, y, width: w, height: h });
      } catch (e) {
        console.error("Signature embed error:", e);
      }
    };

    await embedSign(requestData.signature,        70,           sigY + 5, 160, 70);
    await embedSign(requestData.managerSignature, width - 230,  sigY + 5, 160, 70);

    /* ── footer ── */
    page.drawLine({
      start: { x: 30, y: 40 }, end: { x: width - 30, y: 40 },
      thickness: 0.5, color: rgb(0.75, 0.78, 0.85),
    });
    page.drawText("PROGRESS C & E  |  Document Management System", {
      x: 30, y: 26, size: 8, font: fontNormal, color: gray,
    });
    page.drawText(`Generated: ${new Date().toLocaleDateString("th-TH")}`, {
      x: width - 150, y: 26, size: 8, font: fontNormal, color: gray,
    });

    /* ===== serialize ===== */
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