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
  const base    = getBaseUrl();
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

  // POST — create user OR reset password
  if (req.method === 'POST') {
    const body = req.body ?? {};

    // Reset password: generate recovery link
    if (req.query.action === 'reset') {
      const { email } = body;
      if (!email) return res.status(400).json({ error: 'email requerido' });
      const r = await fetch(`${base}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'recovery', email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(r.status).json({ error: data.message ?? data.error_description ?? 'Error generando enlace' });
      return res.status(200).json({ link: data.action_link ?? null, sent: true });
    }

    // Create new user
    const { email, password, first_name, second_name, first_last_name, second_last_name, identification, phone } = body;
    if (!email || !password || !first_name || !first_last_name || !second_last_name || !identification) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, apellidos, identificación, correo, contraseña)' });
    }
    const display_name = [first_name, second_name, first_last_name, second_last_name].filter(Boolean).join(' ');
    const r = await fetch(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name, first_name, second_name, first_last_name, second_last_name, identification, phone },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data.message ?? data.error_description ?? 'Error creando usuario' });
    return res.status(201).json({ ok: true, user: data });
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

  // PATCH — update user
  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const { display_name, email, password, first_name, second_name, first_last_name, second_last_name, identification, phone } = req.body ?? {};
    const patchBody: Record<string, unknown> = {};
    if (email) patchBody.email = email;
    if (password) patchBody.password = password;
    const meta: Record<string, string> = {};
    if (display_name !== undefined) meta.display_name = display_name;
    if (first_name !== undefined) meta.first_name = first_name;
    if (second_name !== undefined) meta.second_name = second_name;
    if (first_last_name !== undefined) meta.first_last_name = first_last_name;
    if (second_last_name !== undefined) meta.second_last_name = second_last_name;
    if (identification !== undefined) meta.identification = identification;
    if (phone !== undefined) meta.phone = phone;
    if (Object.keys(meta).length) patchBody.user_metadata = meta;
    const r = await fetch(`${base}/auth/v1/admin/users/${id}`, {
      method: 'PUT', headers, body: JSON.stringify(patchBody),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data.message ?? 'Error actualizando usuario' });
    return res.status(200).json({ ok: true, user: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
