export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  const query = String(request.query?.q || '').trim();
  if (!key) return response.status(503).json({ error: 'Live stock search is not configured yet.' });
  if (query.length < 2 || query.length > 80) return response.status(400).json({ error: 'Enter at least two characters.' });

  try {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', 'SYMBOL_SEARCH');
    url.searchParams.set('keywords', query);
    url.searchParams.set('apikey', key);
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) return response.status(502).json({ error: 'The market data provider is unavailable.' });
    const data = await upstream.json();
    if (data.Note || data.Information || data['Error Message']) {
      return response.status(429).json({ error: 'Stock search is temporarily rate limited. Try again shortly.' });
    }
    const results = (data.bestMatches || []).map((item) => ({
      symbol: item['1. symbol'],
      name: item['2. name'],
      type: item['3. type'],
      region: item['4. region'],
      currency: item['8. currency'],
    })).filter((item) => item.symbol && item.name && (item.region === 'India' || item.region === 'United States'));
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json({ results });
  } catch {
    return response.status(502).json({ error: 'Could not reach the market data provider.' });
  }
}
