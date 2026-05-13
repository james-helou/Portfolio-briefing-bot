import YahooFinance from "yahoo-finance2";

export type Quote = {
  ticker: string;
  name: string | null;
  price: number;
  prevClose: number | null;
  dayChangePct: number | null;
  currency: string;
};

const yf = new YahooFinance();

export async function getQuote(ticker: string): Promise<Quote | null> {
  try {
    const q = await yf.quote(ticker);
    if (!q || typeof q.regularMarketPrice !== "number") return null;
    const price = q.regularMarketPrice;
    const prevClose = typeof q.regularMarketPreviousClose === "number" ? q.regularMarketPreviousClose : null;
    const dayChangePct =
      prevClose != null && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : null;
    return {
      ticker: (q.symbol ?? ticker).toUpperCase(),
      name: q.shortName ?? q.longName ?? null,
      price,
      prevClose,
      dayChangePct,
      currency: q.currency ?? "USD",
    };
  } catch {
    return null;
  }
}
