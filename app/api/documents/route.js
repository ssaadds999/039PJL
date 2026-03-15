import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const documentType = formData.get("documentType");
    const tags = formData.get("tags");
    const uploadedBy = formData.get("uploadedBy");

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, message: "ไม่พบไฟล์" },
        { status: 400 }
      );
    }

    if (!title || !category || !documentType || !uploadedBy) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    // Check file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "รองรับเฉพาะไฟล์ PDF เท่านั้น" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "ขนาดไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExt = path.extname(originalName);
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `/uploads/documents/${fileName}`;
    const fullPath = path.join(uploadsDir, fileName);
    const documentCode = `DOC-${Date.now()}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Save to database
    const [result] = await pool.query(
  `
  INSERT INTO documents
  (documentCode, fileName, originalName, fileSize, filePath, category, documentType, uploadedBy, title, description, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    documentCode,          // ⭐ เพิ่ม
    fileName,
    originalName,
    file.size,
    filePath,
    category,
    documentType,
    uploadedBy,
    title,
    description || null,
    tags || null,
  ]
);


    return NextResponse.json({
      success: true,
      message: "อัปโหลดเอกสารสำเร็จ",
      documentId: result.insertId,
      fileName: fileName,
      filePath: filePath,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "อัปโหลดไฟล์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

// GET - ดึงรายการเอกสาร
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    const category = searchParams.get("category");
    const documentType = searchParams.get("documentType");

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        d.*,
        u.fullName as uploaderName
      FROM documents d
      LEFT JOIN users u ON d.uploadedBy = u.userId
      WHERE 1=1
    `;
    const params = [];

    // Role-based access control
    if (role === "user") {
      // User เห็นเฉพาะเอกสารส่วนรวม + เอกสารส่วนตัวของตัวเอง
      query += ` AND (d.documentType = 'shared' OR (d.documentType = 'personal' AND d.uploadedBy = ?))`;
      params.push(userId);
    }
    // admin และ manager เห็นเอกสารทั้งหมด

    // Filter by category
    if (category && category !== "all") {
      query += ` AND d.category = ?`;
      params.push(category);
    }

    // Filter by document type
    if (documentType && documentType !== "all") {
      query += ` AND d.documentType = ?`;
      params.push(documentType);
    }

    query += ` ORDER BY d.uploadedAt DESC`;

    const [documents] = await pool.query(query, params);

return NextResponse.json({
  success: true,
  documents,
});

  } catch (err) {
    console.error("Get documents error:", err);
    return NextResponse.json(
      { success: false, message: "ดึงข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}