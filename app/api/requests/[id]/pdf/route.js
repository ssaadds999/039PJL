import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(req, { params }) {
  try {
    const { id } = await params; // ✅ สำคัญมาก

    const { data: request, error } = await supabase
      .from('purchase_requests')
      .select('status')
      .eq('requestId', id)
      .single();

    if (error || !request || request.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "ยังไม่อนุมัติ" },
        { status: 403 }
      );
    }

    const phpPath = "C:\\xampp\\php\\php.exe";

    const scriptPath = path.join(process.cwd(), "app/pdf/generate.php");
    const outputPath = path.join(process.cwd(), `request-${id}.pdf`);

    await new Promise((resolve, reject) => {
      exec(
        `"${phpPath}" "${scriptPath}" ${id} "${outputPath}"`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    const pdfBuffer = fs.readFileSync(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
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
