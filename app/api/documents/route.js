
import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { Buffer } from "buffer";

/* =========================
   POST : upload document
========================= */
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
        { success: false, message: "กรอกข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "รองรับเฉพาะ PDF" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    /* ===== convert file ===== */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /* ===== create safe filename ===== */
    const safeName = file.name.replace(/\s+/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const documentCode = `DOC-${Date.now()}`;

    /* ===== upload to storage ===== */
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

    /* ===== get public url ===== */
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    const filePath = data.publicUrl;

    /* ===== insert to database ===== */
    const { data: row, error } = await supabase
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
      message: "อัปโหลดสำเร็จ",
      documentId: row.documentId,
      filePath
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}


/* =========================
   GET : list documents
========================= */
export async function GET(req) {
  try {

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("documents")
      .select("*");

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
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}
