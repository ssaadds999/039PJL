import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

/* ===== GET ===== */
export async function GET(req, context) {
  try {
    const { id } = await context.params;

    const { data: rows, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        users!submitterId (
          fullName
        )
      `)
      .eq('requestId', id)
      .single();

    if (error || !rows) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}

/* ===== PUT (สำคัญมาก) ===== */
export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { status, managerId, managerSignature } = body;

    if (!id || !status || !managerId || !managerSignature) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('purchase_requests')
      .update({
        status,
        managerId,
        managerSignature,
        approvedAt: new Date().toISOString()
      })
      .eq('requestId', id);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "server error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตสถานะเรียบร้อย",
    });
  } catch (err) {
    console.error("PUT /api/requests/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}
