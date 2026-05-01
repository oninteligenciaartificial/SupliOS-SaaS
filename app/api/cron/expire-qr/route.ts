import { NextResponse } from "next/server";
import { expireStaleQrs } from "@/lib/qr-bolivia";

// Runs every 5 minutes — marks QRs past expiresAt as EXPIRADO
export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expired } = await expireStaleQrs();
  return NextResponse.json({ ok: true, expired });
}
