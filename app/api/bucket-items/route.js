// app/api/bucket-items/route.js

import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET() {
  try {
    const { data: items, error } = await supabase
      .from('bucket_items')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: items || [] });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { _action } = body;

    if (_action === 'update') {
      const { error } = await supabase
        .from('bucket_items')
        .update({
          itemName: body.itemName,
          unitPrice: body.unitPrice,
          description: body.description,
          category: body.category,
          unit: body.unit,
          updatedAt: new Date().toISOString()
        })
        .eq('itemId', body.id);

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "แก้ไขสำเร็จ" });
    }

    if (_action === 'delete') {
      const { error } = await supabase
        .from('bucket_items')
        .delete()
        .eq('itemId', body.id);

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "ลบสำเร็จ" });
    }

    // CREATE (default)
    const { data, error } = await supabase
      .from('bucket_items')
      .insert({
        itemName: body.itemName,
        unitPrice: body.unitPrice,
        description: body.description,
        category: body.category,
        unit: body.unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, itemId: data[0].itemId, message: "เพิ่มรายการสำเร็จ" },
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