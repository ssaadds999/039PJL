import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

    const [rows] = await pool.query(
      "SELECT signature FROM users WHERE userId = ?",
      [userId]
    );

    return NextResponse.json({
      success: true,
      signature: rows[0]?.signature || null,
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

    await pool.query(
      "UPDATE users SET signature = ? WHERE userId = ?",
      [signature, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST signature error:", err);
    return NextResponse.json(
      { success: false, message: "บันทึกลายเซ็นไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
