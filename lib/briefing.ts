export type MontrealToday = {
  year: number;
  month: number;
  day: number;
  weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
};

export function getMontrealToday(now: Date = new Date()): MontrealToday {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montreal",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    weekday: get("weekday") as MontrealToday["weekday"],
  };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_LONG: Record<MontrealToday["weekday"], string> = {
  Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun",
};

export function formatHeaderDate(today: MontrealToday): string {
  return `${WEEKDAY_LONG[today.weekday]} ${MONTH_NAMES[today.month - 1]} ${today.day}`;
}

export function formatMoney(n: number, currency: string = "USD"): string {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function directionEmoji(dayChangePct: number | null): string {
  if (dayChangePct == null) return "⚪";
  if (dayChangePct > 0.05) return "🟢";
  if (dayChangePct < -0.05) return "🔴";
  return "⚪";
}

export function unrealizedGain(
  shares: number | null,
  costBasisPerShare: number | null,
  currentPrice: number | null,
): { amount: number; pct: number } | null {
  if (shares == null || costBasisPerShare == null || currentPrice == null) return null;
  if (costBasisPerShare === 0) return null;
  const amount = (currentPrice - costBasisPerShare) * shares;
  const pct = ((currentPrice - costBasisPerShare) / costBasisPerShare) * 100;
  return { amount, pct };
}

const TELEGRAM_MAX = 4000;

export function chunkMessage(parts: string[], header: string): string[] {
  const chunks: string[] = [];
  let current = header;
  for (const part of parts) {
    const candidate = current ? `${current}\n\n${part}` : part;
    if (candidate.length > TELEGRAM_MAX && current !== header && current !== "") {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
