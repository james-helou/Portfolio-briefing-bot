import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { runBriefing } from "@/lib/run-briefing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runBriefing();
  if (result.ok) {
    return NextResponse.json({ ok: true, status: result.status, chars: result.body.length });
  }
  return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
}
