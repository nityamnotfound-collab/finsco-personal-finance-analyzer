export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  const symbol = String(request.query?.symbol || '').trim();
  const currency = String(request.query?.currency || 'INR').trim().toUpperCase();
  if (!key) return response.status(503).json({ error: 'Live prices are not configured yet.' });
  if (!/^[A-Za-z0-9.-]{1,24}$/.test(symbol)) return response.status(400).json({ error: 'Invalid stock symbol.' });

  try {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', 'GLOBAL_QUOTE');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('apikey', key);
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) return response.status(502).json({ error: 'The market data provider is unavailable.' });
    const data = await upstream.json();
    if (data.Note || data.Information || data['Error Message']) {
      return response.status(429).json({ error: 'Price lookup is temporarily rate limited. Try again shortly.' });
    }
    const quote = data['Global Quote'];
    const price = Number(quote?.['05. price']);
    if (!Number.isFinite(price) || price <= 0) return response.status(404).json({ error: 'No latest market price was found for this stock.' });
    let fxToInr = 1;
    let fxAsOf = '';
    if (currency === 'USD') {
      // Alpha Vantage's free quota is shared across quote and FX requests. Use
      // a separate daily reference-rate source so a valid stock quote is not
      // lost when Alpha Vantage throttles the second request.
      const fxResponse = await fetch('https://api.frankfurter.dev/v2/rate/USD/INR', { signal: AbortSignal.timeout(8000) });
      const fxData = await fxResponse.json();
      fxToInr = Number(fxData?.rate);
      fxAsOf = typeof fxData?.date === 'string' ? fxData.date : '';
      if (!fxResponse.ok || !Number.isFinite(fxToInr) || fxToInr <= 0) return response.status(502).json({ error: 'Could not get the latest USD to INR reference rate.' });
    }
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json({
      symbol: quote['01. symbol'] || symbol,
      price,
      currency,
      fxToInr,
      fxAsOf,
      latestTradingDay: quote['07. latest trading day'] || '',
    });
  } catch {
    return response.status(502).json({ error: 'Could not reach the market data provider.' });
  }
}
