export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, method = 'GET', body } = req.body ?? {};

  // Diagnostic mode: tests URL variants and auth methods
  if (endpoint === '__diag__') {
    const email = (process.env.ALEGRA_EMAIL ?? '').trim();
    const token = (process.env.ALEGRA_TOKEN ?? '').trim();
    const basicCreds = Buffer.from(`${email}:${token}`).toString('base64');

    const attempts: any[] = [];

    // Test different base URLs and auth methods
    const tests = [
      { label: 'r1/contacts — Basic email:token',    url: 'https://api.alegra.com/r1/contacts',    auth: `Basic ${basicCreds}` },
      { label: 'r1/contacts — Bearer token',         url: 'https://api.alegra.com/r1/contacts',    auth: `Bearer ${token}` },
      { label: 'r1/contacts — Token only Basic',     url: 'https://api.alegra.com/r1/contacts',    auth: `Basic ${Buffer.from(`:${token}`).toString('base64')}` },
      { label: 'r2/contacts — Basic email:token',    url: 'https://app.alegra.com/api/r2/contacts',    auth: `Basic ${basicCreds}` },
      { label: 'r1/ (base) — Basic email:token',     url: 'https://api.alegra.com/r1/',            auth: `Basic ${basicCreds}` },
      { label: 'r1/contacts NO auth',                url: 'https://api.alegra.com/r1/contacts',    auth: '' },
    ];

    for (const t of tests) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (t.auth) headers['Authorization'] = t.auth;
      try {
        const r = await fetch(t.url, { headers });
        const text = await r.text();
        attempts.push({ label: t.label, status: r.status, body: text.slice(0, 120) });
      } catch (e: any) {
        attempts.push({ label: t.label, error: e.message });
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

  const url = `https://api.alegra.com/r1/${endpoint}`;
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
