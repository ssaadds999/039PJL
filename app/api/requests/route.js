import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

/* =========================
   GET requests
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
        .from("purchase_requests")
        .select("*")
        .order("submittedDate", { ascending: false })
        .limit(10);
    } else if (role === "manager") {
      query = supabase
        .from("purchase_requests")
        .select("*")
        .order("urgencyLevel", { ascending: false })
        .order("submittedDate", { ascending: false })
        .limit(10);
    } else if (role === "user") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Missing userId" },
          { status: 400 }
        );
      }
      query = supabase
        .from("purchase_requests")
        .select("*")
        .eq("submitterId", userId)
        .order("submittedDate", { ascending: false })
        .limit(10);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "โหลดข้อมูลไม่ได้" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requests: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}

/* =========================
   POST create request
========================= */
export async function POST(request) {
  try {
    const body = await request.json();

    const { requestType, userId, signature, items, totalAmount, attachedFiles } = body;

    if (!requestType || !userId || !signature || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const amount =
      totalAmount || items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const itemNames = items.map((i) => i.name).join(", ");

    const now = new Date().toISOString(); // <-- เวลาปัจจุบัน

    const { data, error } = await supabase
      .from("purchase_requests")
      .insert({
        submitterId: userId,
        itemName: itemNames,
        quantity: items.length,
        unitPrice: 1,
        totalAmount: amount,
        itemsJson: JSON.stringify(items),
        attachedFilesJson: JSON.stringify(attachedFiles || []),
        requestType,
        status: "pending",
        signature,
        submittedDate: now, // <-- เพิ่มตรงนี้
        createdAt: now,     // <-- เพิ่มตรงนี้
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "สร้างคำขอไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requestId: data.requestId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}