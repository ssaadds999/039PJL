import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบ",
        type: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
      });
    }

    const user = await queryOne(
      `SELECT userId, username, fullName, role, password
       FROM users
       WHERE username = ?`,
      [username]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบผู้ใช้นี้ในระบบ",
        type: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
      });
    }

    // ✅ ใช้ bcrypt เปรียบเทียบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
        type: "error",
        title: "รหัสผ่านผิด",
      });
    }

    // ส่งข้อมูล user กลับ (ไม่ส่ง password)
    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      type: "success",
      title: "ยินดีต้อนรับ!",
      user: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
        type: "error",
        title: "ข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}