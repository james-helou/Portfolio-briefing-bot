export type HoldingInput = {
  ticker: string;
  shares: number | null;
  cost_basis_per_share: number | null;
  notes: string | null;
};

const TICKER_RE = /^[A-Z0-9]{1,10}(\.[A-Z]{1,5})?$/;

export function validateHolding(
  input: unknown,
  opts: { partial?: boolean } = {},
): { ok: true; value: Partial<HoldingInput> } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Body must be an object" };
  }
  const o = input as Record<string, unknown>;
  const out: Partial<HoldingInput> = {};

  if ("ticker" in o || !opts.partial) {
    if (typeof o.ticker !== "string" || !o.ticker.trim()) {
      return { ok: false, error: "ticker is required" };
    }
    const normalized = o.ticker.trim().toUpperCase();
    if (!TICKER_RE.test(normalized)) {
      return { ok: false, error: "ticker must be 1-10 letters/digits, optionally with .EXCHANGE suffix" };
    }
    out.ticker = normalized;
  }

  if ("shares" in o) {
    if (o.shares === null) {
      out.shares = null;
    } else if (typeof o.shares === "number" && Number.isFinite(o.shares) && o.shares > 0) {
      out.shares = o.shares;
    } else {
      return { ok: false, error: "shares must be a positive number or null" };
    }
  }

  if ("cost_basis_per_share" in o) {
    if (o.cost_basis_per_share === null) {
      out.cost_basis_per_share = null;
    } else if (
      typeof o.cost_basis_per_share === "number" &&
      Number.isFinite(o.cost_basis_per_share) &&
      o.cost_basis_per_share > 0
    ) {
      out.cost_basis_per_share = o.cost_basis_per_share;
    } else {
      return { ok: false, error: "cost_basis_per_share must be a positive number or null" };
    }
  }

  if ("notes" in o) {
    if (o.notes === null) {
      out.notes = null;
    } else if (typeof o.notes === "string") {
      if (o.notes.length > 500) return { ok: false, error: "notes too long (max 500)" };
      out.notes = o.notes;
    } else {
      return { ok: false, error: "notes must be a string or null" };
    }
  }

  return { ok: true, value: out };
}
