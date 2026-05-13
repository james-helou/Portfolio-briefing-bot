import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { validateHolding } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT id, ticker, shares, cost_basis_per_share, notes, created_at
    FROM holdings
    ORDER BY ticker
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const result = validateHolding(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const v = result.value;

  const sql = getSql();
  const inserted = await sql`
    INSERT INTO holdings (ticker, shares, cost_basis_per_share, notes)
    VALUES (${v.ticker!}, ${v.shares ?? null}, ${v.cost_basis_per_share ?? null}, ${v.notes ?? null})
    RETURNING id, ticker, shares, cost_basis_per_share, notes, created_at
  `;
  return NextResponse.json(inserted[0], { status: 201 });
}
