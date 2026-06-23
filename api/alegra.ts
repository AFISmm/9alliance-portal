export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, method = 'GET', body } = req.body ?? {};

  if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });

  const email = (process.env.ALEGRA_EMAIL ?? '').trim();
  const token = (process.env.ALEGRA_TOKEN ?? '').trim();
  const credentials = Buffer.from(`${email}:${token}`).toString('base64');

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

  const url = `https://api.alegra.com/api/v1/${endpoint}`;
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
