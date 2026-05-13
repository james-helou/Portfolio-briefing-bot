export type Quote = {
  ticker: string;
  name: string | null;
  price: number;
  prevClose: number | null;
  dayChangePct: number | null;
  currency: string;
};

type ChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
        symbol?: string;
        shortName?: string;
        longName?: string;
      };
    }>;
  };
};

async function tryFetch(symbol: string): Promise<Quote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioBriefingBot/1.0)" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ChartResponse;
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    const price = meta.regularMarketPrice;
    const prevClose =
      typeof meta.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : typeof meta.previousClose === "number"
          ? meta.previousClose
          : null;
    const dayChangePct =
      prevClose != null && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : null;
    return {
      ticker: meta.symbol?.toUpperCase() ?? symbol.toUpperCase(),
      name: meta.shortName ?? meta.longName ?? null,
      price,
      prevClose,
      dayChangePct,
      currency: meta.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

// Yahoo uses ticker.TO for TSX and ticker-CLASS.TO for unit/preferred shares
// (e.g. user enters AP.UN, Yahoo wants AP-UN.TO; VFV → VFV.TO).
function tsxVariants(ticker: string): string[] {
  if (/\.(TO|V|NE|CN)$/i.test(ticker)) return [];
  const dotReplaced = ticker.replace(/\./g, "-");
  const variants = new Set<string>();
  variants.add(`${ticker}.TO`);
  if (dotReplaced !== ticker) variants.add(`${dotReplaced}.TO`);
  return [...variants];
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  const direct = await tryFetch(ticker);
  if (direct) return direct;
  for (const variant of tsxVariants(ticker)) {
    const r = await tryFetch(variant);
    if (r) return r;
  }
  return null;
}
