import { getSql } from "./db";
import { getQuote } from "./yahoo";
import { summarizeTicker } from "./gemini";
import { sendTelegramMessage } from "./telegram";
import {
  chunkMessage,
  directionEmoji,
  formatHeaderDate,
  formatMoney,
  formatPct,
  getMontrealToday,
  unrealizedGain,
} from "./briefing";
import { TAG_HANDLER_ERROR, TAG_NO_OP, withSuffix } from "./notification-tags";

type Holding = {
  id: string;
  ticker: string;
  shares: number | null;
  cost_basis_per_share: number | null;
  notes: string | null;
};

export type BriefingResult =
  | { ok: true; status: "no-op" | "sent"; body: string }
  | { ok: false; status: "error"; error: string };

export async function runBriefing(): Promise<BriefingResult> {
  try {
    const sql = getSql();
    const today = getMontrealToday();

    const holdings = (await sql<Holding[]>`
      SELECT id, ticker, shares, cost_basis_per_share, notes
      FROM holdings
      ORDER BY ticker
    `) as unknown as Holding[];

    if (holdings.length === 0) {
      await sql`
        INSERT INTO briefings (success, message_body, error_message)
        VALUES (true, NULL, ${TAG_NO_OP})
      `;
      return { ok: true, status: "no-op", body: "" };
    }

    const sections: string[] = [];

    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      // Light throttle between holdings to stay polite to rate limits.
      if (i > 0) await new Promise((r) => setTimeout(r, 800));
      const quote = await getQuote(h.ticker);
      const summary = await summarizeTicker({
        ticker: h.ticker,
        name: quote?.name ?? null,
        currentPrice: quote?.price ?? null,
        dayChangePct: quote?.dayChangePct ?? null,
      });

      const emoji = directionEmoji(quote?.dayChangePct ?? null);
      const priceLine = quote
        ? `${emoji} ${h.ticker}   ${formatMoney(quote.price, quote.currency)}${
            quote.dayChangePct != null ? `   ${formatPct(quote.dayChangePct)}` : ""
          }`
        : `⚪ ${h.ticker}   (price unavailable)`;

      const gain = unrealizedGain(
        h.shares != null ? Number(h.shares) : null,
        h.cost_basis_per_share != null ? Number(h.cost_basis_per_share) : null,
        quote?.price ?? null,
      );
      const positionParts: string[] = [];
      if (h.shares != null) positionParts.push(`${Number(h.shares)} sh`);
      if (h.cost_basis_per_share != null)
        positionParts.push(`cost ${formatMoney(Number(h.cost_basis_per_share))}`);
      if (gain) {
        positionParts.push(`${formatMoney(gain.amount)} (${formatPct(gain.pct)})`);
      }
      const positionLine = positionParts.length > 0 ? positionParts.join(" · ") : null;

      const summaryText = summary.ok
        ? summary.text
        : `(briefing error: ${summary.error.slice(0, 250)})`;

      const section = [priceLine, positionLine, summaryText].filter(Boolean).join("\n");
      sections.push(section);
    }

    const header = `📊 Morning Portfolio Brief — ${formatHeaderDate(today)}`;
    const chunks = chunkMessage(sections, header);

    let allOk = true;
    let firstError: string | undefined;
    for (const chunk of chunks) {
      const r = await sendTelegramMessage(chunk);
      if (!r.ok) {
        allOk = false;
        firstError ??= r.error;
      }
    }

    const fullBody = chunks.join("\n\n--- continued ---\n\n");
    await sql`
      INSERT INTO briefings (success, message_body, error_message)
      VALUES (${allOk}, ${fullBody}, ${allOk ? null : firstError ?? "unknown"})
    `;

    if (allOk) return { ok: true, status: "sent", body: fullBody };
    return { ok: false, status: "error", error: firstError ?? "telegram delivery failed" };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    try {
      const sql = getSql();
      await sql`
        INSERT INTO briefings (success, message_body, error_message)
        VALUES (false, NULL, ${withSuffix(TAG_HANDLER_ERROR, detail)})
      `;
    } catch {}
    return { ok: false, status: "error", error: detail };
  }
}
