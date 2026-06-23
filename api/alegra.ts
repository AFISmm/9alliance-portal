export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, method = 'GET', body } = req.body ?? {};

  // Diagnostic mode: returns env var presence + raw Alegra ping
  if (endpoint === '__diag__') {
    const email = process.env.ALEGRA_EMAIL ?? '';
    const token = process.env.ALEGRA_TOKEN ?? '';
    const hasEmail = email.length > 0;
    const hasToken = token.length > 0;
    const credentials = Buffer.from(`${email}:${token}`).toString('base64');
    let ping: any = null;
    try {
      const r = await fetch('https://app.alegra.com/api/r1/contacts?limit=1', {
        headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
      });
      const text = await r.text();
      ping = { status: r.status, body: text.slice(0, 300) };
    } catch (e: any) {
      ping = { error: e.message };
    }
    return res.status(200).json({ hasEmail, hasToken, emailPrefix: email.slice(0, 4), tokenLen: token.length, ping });
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
