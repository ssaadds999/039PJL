// app/api/bucket-items/route.js - แบบ auto-detect ชื่อ primary key

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ฟังก์ชันหาชื่อ primary key อัตโนมัติ
async function getPrimaryKeyColumn() {
  try {
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'bucket_items' 
      AND CONSTRAINT_NAME = 'PRIMARY'
      LIMIT 1
    `);
    return columns[0]?.COLUMN_NAME || 'itemId'; // default ถ้าหาไม่เจอ
  } catch {
    return 'itemId'; // fallback
  }
}

let primaryKeyColumn = null;

export async function GET() {
  try {
    const [items] = await pool.query(
      'SELECT * FROM bucket_items ORDER BY createdAt DESC'
    );
    return NextResponse.json({ success: true, items: items || [] });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // หา primary key ครั้งแรกถ้ายังไม่มี
    if (!primaryKeyColumn) {
      primaryKeyColumn = await getPrimaryKeyColumn();
      console.log('Detected primary key:', primaryKeyColumn);
    }

    const body = await req.json();
    const { _action } = body;

    if (_action === 'update') {
      const [result] = await pool.query(
        `UPDATE bucket_items SET 
          itemName = ?, unitPrice = ?, description = ?, category = ?, unit = ?, updatedAt = NOW()
        WHERE ${primaryKeyColumn} = ?`,
        [body.itemName, body.unitPrice, body.description, body.category, body.unit, body.id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, message: `ไม่พบรายการ (ตรวจสอบ ${primaryKeyColumn})` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "แก้ไขสำเร็จ" });
    }

    if (_action === 'delete') {
      const [result] = await pool.query(
        `DELETE FROM bucket_items WHERE ${primaryKeyColumn} = ?`,
        [body.id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, message: `ไม่พบรายการ (ตรวจสอบ ${primaryKeyColumn})` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "ลบสำเร็จ" });
    }

    // CREATE (default)
    const [result] = await pool.query(
      `INSERT INTO bucket_items (itemName, unitPrice, description, category, unit, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [body.itemName, body.unitPrice, body.description, body.category, body.unit]
    );
    
    return NextResponse.json(
      { success: true, itemId: result.insertId, message: "เพิ่มรายการสำเร็จ" },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}