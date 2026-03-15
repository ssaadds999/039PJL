import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ success: true, status: "ok" }, { headers: { "Content-Type": "application/json; charset=utf-8" } });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err?.message || err) }, { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
}
