import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('signature')
      .eq('userId', userId)
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "ดึงลายเซ็นไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signature: user?.signature || null,
    });
  } catch (err) {
    console.error("GET signature error:", err);
    return NextResponse.json(
      { success: false, message: "ดึงลายเซ็นไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId, signature } = await req.json();

    if (!userId || !signature) {
      return NextResponse.json(
        { success: false, message: "Missing data" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('users')
      .update({ signature })
      .eq('userId', userId);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "บันทึกลายเซ็นไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST signature error:", err);
    return NextResponse.json(
      { success: false, message: "บันทึกลายเซ็นไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

