import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Quick probe to Neon DB
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        serverTime: new Date().toISOString(),
        service: "KRUMBISTRY Central POS API",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        error: "Database unreachable",
        serverTime: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
