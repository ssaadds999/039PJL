import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password, fullName, role } = await req.json();

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // insert user (signature = NULL)
    await pool.query(
      `
      INSERT INTO users
        (username, password, fullName, role, signature)
      VALUES (?, ?, ?, ?, NULL)
      `,
      [username, hashed, fullName, role]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "เพิ่มผู้ใช้ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
