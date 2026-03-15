import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

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

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "รองรับเฉพาะไฟล์ PDF เท่านั้น" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const documentCode = `DOC-${Date.now()}`;

    // upload ไป Supabase Storage
    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("documents")
        .upload(fileName, buffer, {
          contentType: "application/pdf",
        });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { success: false, message: "อัปโหลดไฟล์ไม่สำเร็จ" },
        { status: 500 }
      );
    }

    const filePath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${fileName}`;

    const { data, error } = await supabase
      .from("documents")
      .insert({
        documentCode,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        filePath,
        category,
        documentType,
        uploadedBy: parseInt(uploadedBy),
        title,
        description: description || null,
        tags: tags || null,
      })
      .select();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "บันทึกข้อมูลไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปโหลดเอกสารสำเร็จ",
      documentId: data[0].documentId,
      fileName,
      filePath,
    });

  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "อัปโหลดไฟล์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

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

    let query = supabase
      .from("documents")
      .select(`
        *,
        users!uploadedBy (
          fullName
        )
      `)
      .order("uploadedAt", { ascending: false });

    if (role === "user") {
      query = query.or(
        `documentType.eq.shared,and(documentType.eq.personal,uploadedBy.eq.${userId})`
      );
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (documentType && documentType !== "all") {
      query = query.eq("documentType", documentType);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "ดึงข้อมูลไม่สำเร็จ" },
        { status: 500 }
      );
    }

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