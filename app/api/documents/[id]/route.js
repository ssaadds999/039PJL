import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { queryOne } from "@/lib/db";
import pool from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลเอกสาร
    const document = await queryOne(
      "SELECT * FROM documents WHERE documentId = ?",
      [id]
    );

    if (!document) {
      return NextResponse.json(
        { success: false, message: "ไม่พบเอกสาร" },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์
    // User ลบได้เฉพาะเอกสารของตัวเอง
    // Admin และ Manager ลบได้ทั้งหมด
    if (role === "user" && document.uploadedBy !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, message: "ไม่มีสิทธิ์ลบเอกสารนี้" },
        { status: 403 }
      );
    }

    // ลบไฟล์จริง
    const fullPath = path.join(process.cwd(), "public", document.filePath);
    try {
      await unlink(fullPath);
    } catch (err) {
      console.error("Delete file error:", err);
      // ไม่ return error เพราะอาจไฟล์ถูกลบไปแล้ว
    }

    // ลบจาก database
    await pool.query("DELETE FROM documents WHERE documentId = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "ลบเอกสารสำเร็จ",
    });
  } catch (err) {
    console.error("Delete document error:", err);
    return NextResponse.json(
      { success: false, message: "ลบเอกสารไม่สำเร็จ" },
      { status: 500 }
    );
  }
}