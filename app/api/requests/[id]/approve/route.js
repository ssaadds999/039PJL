import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { data: request, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        users!submitterId (
          fullName
        )
      `)
      .eq('requestId', params.id)
      .single();

    if (error || !request) {
      return NextResponse.json(
        { success: false },
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
      { success: false },
      { status: 500 }
    );
  }
}
