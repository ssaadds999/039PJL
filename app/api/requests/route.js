// app/api/requests/route.js
import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

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

    let query;

    if (role === "admin") {
      query = supabase
        .from('purchase_requests')
        .select(`
          requestId,
          itemName,
          totalAmount,
          status,
          submittedDate,
          users!submitterId (
            fullName
          )
        `)
        .order('submittedDate', { ascending: false })
        .limit(10);
    }

    else if (role === "manager") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Missing userId" },
          { status: 400 }
        );
      }

      query = supabase
        .from('purchase_requests')
        .select(`
          requestId,
          itemName,
          totalAmount,
          status,
          urgencyLevel,
          submittedDate,
          users!submitterId (
            fullName
          )
        `)
        .order('urgencyLevel', { ascending: false })
        .order('submittedDate', { ascending: false })
        .limit(10);
    }

    else if (role === "user") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Missing userId" },
          { status: 400 }
        );
      }

      query = supabase
        .from('purchase_requests')
        .select(`
          requestId,
          itemName,
          totalAmount,
          status,
          submittedDate
        `)
        .eq('submitterId', userId)
        .order('submittedDate', { ascending: false })
        .limit(10);
    }

    else {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
        { status: 500 }
      );
    }

    const requests = rows.map((r) => ({
      requestId: r.requestId,
      title: r.itemName,
      amount: Number(r.totalAmount),
      status: r.status,
      submittedDate: r.submittedDate,
      submitterName: r.users?.fullName,
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
    const { data, error } = await supabase
      .from('purchase_requests')
      .insert({
        submitterId: userId,
        itemName: items.map(item => item.name).join(', '),
        quantity: items.length,
        unitPrice: 1,
        totalAmount: totalAmount || items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        itemsJson: JSON.stringify(items),
        attachedFilesJson: JSON.stringify(attachedFiles || []),
        requestType,
        status: 'pending',
        signature,
      })
      .select();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "สร้างคำขอไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: data[0].requestId
    });

  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { success: false, message: "สร้างคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
