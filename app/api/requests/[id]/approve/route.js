import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        pr.*,
        u.fullName AS submitterName
      FROM purchase_requests pr
      LEFT JOIN users u ON pr.submitterId = u.userId
      WHERE pr.requestId = ?
      `,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: rows[0],
    });
  } catch (err) {
    console.error("GET request detail error:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
