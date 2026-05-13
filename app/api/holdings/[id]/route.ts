import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { validateHolding } from "@/lib/validate";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const result = validateHolding(body, { partial: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const v = result.value;
  if (Object.keys(v).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const sql = getSql();
  const updated = await sql`
    UPDATE holdings SET ${sql(v as Record<string, unknown>)}
    WHERE id = ${id}
    RETURNING id, ticker, shares, cost_basis_per_share, notes, created_at
  `;
  if (updated.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const sql = getSql();
  const deleted = await sql`DELETE FROM holdings WHERE id = ${id} RETURNING id`;
  if (deleted.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
