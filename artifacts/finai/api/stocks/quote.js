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
    if (currency === 'USD') {
      const fxUrl = new URL('https://www.alphavantage.co/query');
      fxUrl.searchParams.set('function', 'CURRENCY_EXCHANGE_RATE');
      fxUrl.searchParams.set('from_currency', 'USD');
      fxUrl.searchParams.set('to_currency', 'INR');
      fxUrl.searchParams.set('apikey', key);
      const fxResponse = await fetch(fxUrl, { signal: AbortSignal.timeout(8000) });
      const fxData = await fxResponse.json();
      if (!fxResponse.ok || fxData.Note || fxData.Information) return response.status(429).json({ error: 'Currency conversion is temporarily rate limited. Try again shortly.' });
      fxToInr = Number(fxData['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
      if (!Number.isFinite(fxToInr) || fxToInr <= 0) return response.status(502).json({ error: 'Could not get the USD to INR exchange rate.' });
    }
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json({
      symbol: quote['01. symbol'] || symbol,
      price,
      currency,
      fxToInr,
      latestTradingDay: quote['07. latest trading day'] || '',
    });
  } catch {
    return response.status(502).json({ error: 'Could not reach the market data provider.' });
  }
}
