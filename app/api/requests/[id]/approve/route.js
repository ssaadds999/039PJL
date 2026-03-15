import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    // แก้ไข: await params สำหรับ Next.js 15+
    const { id } = await params;

    const { data: request, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        users!submitterId (
          fullName
        )
      `)
      .eq('requestId', id)
      .single();

    if (error || !request) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (err) {
    console.error("GET request detail error:", err);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}