export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });

  try {
    const upstream = await fetch('https://api.frankfurter.dev/v2/rate/USD/INR', {
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json();
    const rate = Number(data?.rate);
    if (!upstream.ok || !Number.isFinite(rate) || rate <= 0) {
      return response.status(502).json({ error: 'Could not get the latest USD to INR reference rate.' });
    }

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return response.status(200).json({ rate, date: typeof data.date === 'string' ? data.date : '' });
  } catch {
    return response.status(502).json({ error: 'Could not reach the exchange-rate provider.' });
  }
}
