import { NextResponse } from "next/server";
import pool from "@/lib/db";

/* ===== GET ===== */
export async function GET(req, context) {
  try {
    const { id } = await context.params;

    const [rows] = await pool.query(
      `
      SELECT
        pr.*,
        u.fullName AS submitterName
      FROM purchase_requests pr
      LEFT JOIN users u ON pr.submitterId = u.userId
      WHERE pr.requestId = ?
      `,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: rows[0],
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

    const [result] = await pool.query(
      `
      UPDATE purchase_requests
      SET
        status = ?,
        managerId = ?,
        managerSignature = ?,
        approvedAt = NOW()
      WHERE requestId = ?
      `,
      [status, managerId, managerSignature, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรายการ" },
        { status: 404 }
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
