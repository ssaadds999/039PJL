// app/api/requests/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

/* =========================
   GET : ดึงรายการคำขอ
   ========================= */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const userId = searchParams.get("userId");

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Missing role" },
        { status: 400 }
      );
    }

    let sql = "";
    let params = [];

    if (role === "admin") {
      sql = `
        SELECT
          pr.requestId,
          pr.itemName,
          pr.totalAmount,
          pr.status,
          pr.submittedDate,
          u.fullName AS submitterName
        FROM purchase_requests pr
        LEFT JOIN users u ON pr.submitterId = u.userId
        ORDER BY pr.submittedDate DESC
        LIMIT 10
      `;
    }

    else if (role === "manager") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Missing userId" },
          { status: 400 }
        );
      }

      sql = `
        SELECT
          pr.requestId,
          pr.itemName,
          pr.totalAmount,
          pr.status,
          pr.urgencyLevel,
          pr.submittedDate,
          u.fullName AS submitterName
        FROM purchase_requests pr
        LEFT JOIN users u ON pr.submitterId = u.userId
        ORDER BY pr.urgencyLevel DESC, pr.submittedDate DESC
        LIMIT 10
      `;
    }

    else if (role === "user") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Missing userId" },
          { status: 400 }
        );
      }

      sql = `
        SELECT
          pr.requestId,
          pr.itemName,
          pr.totalAmount,
          pr.status,
          pr.submittedDate
        FROM purchase_requests pr
        WHERE pr.submitterId = ?
        ORDER BY pr.submittedDate DESC
        LIMIT 10
      `;
      params = [userId];
    }

    else {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(sql, params);

    const requests = rows.map((r) => ({
      requestId: r.requestId,
      title: r.itemName,
      amount: Number(r.totalAmount),
      status: r.status,
      submittedDate: r.submittedDate,
    }));

    return NextResponse.json({
      success: true,
      requests,
    });

  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

/* =========================
   POST : สร้างคำขอใหม่
   ========================= */
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      requestType,
      userId,
      signature,
      items,
      totalAmount,
      attachedFiles,
    } = body;

    if (
      !requestType ||
      !userId ||
      !signature ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    // บันทึกคำขอหลัก
    const [result] = await pool.query(
      `
      INSERT INTO purchase_requests
      (
        submitterId,
        itemName,
        quantity,
        unitPrice,
        totalAmount,
        itemsJson,
        attachedFilesJson,
        requestType,
        status,
        signature
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `,
      [
        userId,
        items.map(item => item.name).join(', '),
        items.length,
        1,
        totalAmount || items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        JSON.stringify(items),
        JSON.stringify(attachedFiles || []),
        requestType,
        signature,
      ]
    );

    return NextResponse.json({ 
      success: true,
      requestId: result.insertId 
    });

  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { success: false, message: "สร้างคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
