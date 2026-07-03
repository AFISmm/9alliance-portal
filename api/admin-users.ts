// Admin user management — requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars

function getSupabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return {
    'Authorization': `Bearer ${key}`,
    'apikey': key,
    'Content-Type': 'application/json',
  };
}

function getBaseUrl() {
  return (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
}

export default async function handler(req: any, res: any) {
  const base = getBaseUrl();
  const headers = getSupabaseHeaders();

  if (!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos' });
  }

  // GET — list users
  if (req.method === 'GET') {
    const r = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=200`, { headers });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message ?? 'Error listando usuarios' });
    return res.status(200).json({ users: data.users ?? [] });
  }

  // DELETE — remove user
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const r = await fetch(`${base}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers });
    if (r.status === 204 || r.ok) return res.status(200).json({ ok: true });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json({ error: data.message ?? 'Error eliminando usuario' });
  }

  // PATCH — update user (display_name, email, password)
  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const { display_name, email, password } = req.body ?? {};
    const body: Record<string, unknown> = {};
    if (email) body.email = email;
    if (password) body.password = password;
    if (display_name !== undefined) body.user_metadata = { display_name };
    const r = await fetch(`${base}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data.message ?? 'Error actualizando usuario' });
    return res.status(200).json({ ok: true, user: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
