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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const documentCode = `DOC-${Date.now()}`;

    // upload file ไป storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      return NextResponse.json(
        { success: false, message: uploadError.message },
        { status: 500 }
      );
    }

    // สร้าง public URL
    const { data: publicUrl } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    const filePath = publicUrl.publicUrl;

    // insert database
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
        uploadedBy: Number(uploadedBy),
        title,
        description: description || null,
        tags: tags || null
      })
      .select()
      .single();

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปโหลดเอกสารสำเร็จ",
      documentId: data.documentId,
      fileName,
      filePath
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

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

    const { data, error } = await query;

    if (error) {
      console.error("FETCH ERROR:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data
    });

  } catch (err) {
    console.error("GET ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}