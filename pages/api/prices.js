const SYMBOLS = [
  "EFERT.KA","MARI.KA","HUBC.KA","SYS.KA",
  "FFC.KA","LUCK.KA","OGDC.KA","MEBL.KA",
  "HIUA.L","ISWD.L","MWIM.L"
];

async function fetchOne(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return { symbol, error: `HTTP ${res.status}` };

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta   = result?.meta;

    if (!meta) return { symbol, error: "No data" };

    const quotes = result?.indicators?.quote?.[0];
    const closes = quotes?.close?.filter(Boolean).slice(-10) || [];

    return {
      symbol,
      price:      meta.regularMarketPrice    ?? null,
      open:       meta.regularMarketOpen     ?? null,
      prevClose:  meta.chartPreviousClose    ?? meta.previousClose ?? null,
      dayHigh:    meta.regularMarketDayHigh  ?? null,
      dayLow:     meta.regularMarketDayLow   ?? null,
      volume:     meta.regularMarketVolume   ?? null,
      currency:   meta.currency              ?? "",
      shortName:  meta.shortName             ?? symbol,
      marketState:meta.marketState           ?? "CLOSED",
      sparkline:  closes,
      ok: true,
    };
  } catch (e) {
    return { symbol, error: e.message, ok: false };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const results = await Promise.all(SYMBOLS.map(fetchOne));
    const data = {};
    results.forEach(r => { data[r.symbol] = r; });

    return res.status(200).json({
      data,
      fetchedAt: new Date().toISOString(),
      success: true,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, success: false });
  }
      }
