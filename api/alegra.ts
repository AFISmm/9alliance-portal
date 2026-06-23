export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, method = 'GET', body } = req.body ?? {};

  // Diagnostic mode: tests multiple URLs to find what works
  if (endpoint === '__diag__') {
    const email = (process.env.ALEGRA_EMAIL ?? '').trim();
    const token = (process.env.ALEGRA_TOKEN ?? '').trim();
    const credentials = Buffer.from(`${email}:${token}`).toString('base64');
    const headers = { Authorization: `Basic ${credentials}`, Accept: 'application/json' };

    const attempts: any[] = [];
    const testUrls = [
      'https://app.alegra.com/api/r1/contacts?limit=1',
      'https://app.alegra.com/api/r1/invoices?limit=1',
      'https://app.alegra.com/api/r1/items?limit=1',
      'https://app.alegra.com/api/r1/users',
      'https://app.alegra.com/api/r1/company',
    ];
    for (const url of testUrls) {
      try {
        const r = await fetch(url, { headers });
        const text = await r.text();
        attempts.push({ url, status: r.status, body: text.slice(0, 150) });
        if (r.status === 200) break; // stop on first success
      } catch (e: any) {
        attempts.push({ url, error: e.message });
      }
    }
    return res.status(200).json({
      hasEmail: email.length > 0,
      hasToken: token.length > 0,
      emailPrefix: email.slice(0, 5),
      tokenLen: token.length,
      attempts,
    });
  }

  if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });

  const email = process.env.ALEGRA_EMAIL ?? '';
  const token = process.env.ALEGRA_TOKEN ?? '';
  const credentials = Buffer.from(`${email.trim()}:${token.trim()}`).toString('base64');

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const url = `https://app.alegra.com/api/r1/${endpoint}`;
  const upstream = await fetch(url, fetchOptions);
  const data = await upstream.json().catch(() => ({ error: 'Respuesta no JSON de Alegra', endpoint }));
  if (!upstream.ok) {
    return res.status(upstream.status).json({
      ...data,
      _status: upstream.status,
      _endpoint: endpoint,
    });
  }
  return res.status(200).json(data);
}
