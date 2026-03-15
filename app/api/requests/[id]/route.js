import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

/* ===== GET ===== */
export async function GET(req, { params }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบ id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        users!submitterId (
          fullName
        )
      `)
      .eq("requestId", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
    });

  } catch (err) {
    console.error("GET request error:", err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}

/* ===== PUT ===== */
export async function PUT(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { status, managerId, managerSignature } = body;

    if (!id || !status || !managerId || !managerSignature) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("purchase_requests")
      .update({
        status,
        managerId,
        managerSignature,
        approvedAt: new Date().toISOString(),
      })
      .eq("requestId", id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตสถานะเรียบร้อย",
    });

  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}