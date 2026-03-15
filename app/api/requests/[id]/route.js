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

    // ดึงข้อมูล request ก่อน
    const { data: requestData, error: requestError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("requestId", id)
      .single();

    if (requestError || !requestData) {
      console.error("GET request error:", requestError);
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    // ดึงชื่อผู้ยื่นแยก (ถ้า users table มีอยู่)
    let submitterName = "ไม่ทราบชื่อ";
    if (requestData.submitterId) {
      const { data: userData } = await supabase
        .from("users")
        .select("fullName")
        .eq("userId", requestData.submitterId)
        .single();

      if (userData?.fullName) {
        submitterName = userData.fullName;
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        ...requestData,
        submitterName,
      },
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
        updatedAt: new Date().toISOString(),
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