export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombre, apellido, correo, mensaje, respuesta } = req.body ?? {};

  if (!correo || !respuesta) {
    return res.status(400).json({ error: 'correo y respuesta son requeridos' });
  }

  const resendKey = (process.env.RESEND_API_KEY ?? '').trim();

  if (!resendKey) {
    // Sin clave configurada: registrar en logs y responder OK para no bloquear UI
    console.warn('[PQR] RESEND_API_KEY no configurado. PQR no enviada por email:', { correo, nombre, apellido });
    return res.status(200).json({ ok: true, note: 'RESEND_API_KEY no configurado' });
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1829;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1829;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111c2e;border-radius:12px;border:1px solid rgba(255,255,255,.08);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B2A4A,#0d1829);padding:28px 32px;border-bottom:1px solid rgba(255,255,255,.08);">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:.18em;color:#C9A84C;text-transform:uppercase;">9 ALLIANCE</p>
            <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#F4F7FB;">Respuesta a tu PQR</h1>
          </td>
        </tr>

        <!-- Saludo -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0;font-size:14px;color:#AEBCCD;line-height:1.6;">
              Hola <strong style="color:#F4F7FB;">${nombre} ${apellido}</strong>,<br>
              hemos revisado tu solicitud y a continuación encontrarás nuestra respuesta.
            </p>
          </td>
        </tr>

        <!-- Respuesta -->
        <tr>
          <td style="padding:20px 32px;">
            <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:8px;padding:16px 20px;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C9A84C;">Respuesta de Felipe Serna</p>
              <p style="margin:0;font-size:13.5px;color:#F4F7FB;line-height:1.65;white-space:pre-wrap;">${respuesta}</p>
            </div>
          </td>
        </tr>

        <!-- PQR original -->
        <tr>
          <td style="padding:0 32px 24px;">
            <details>
              <summary style="font-size:11px;color:#7C8A9C;cursor:pointer;padding:8px 0;letter-spacing:.04em;">Ver solicitud original</summary>
              <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:14px 16px;margin-top:8px;">
                <p style="margin:0;font-size:12px;color:#AEBCCD;line-height:1.6;white-space:pre-wrap;">${mensaje}</p>
              </div>
            </details>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:rgba(0,0,0,.2);padding:16px 32px;border-top:1px solid rgba(255,255,255,.06);">
            <p style="margin:0;font-size:11px;color:#566375;line-height:1.5;">
              Este correo fue generado automáticamente por el Portal 9 Alliance.<br>
              Si tienes más consultas, puedes radicar una nueva PQR desde el portal.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Portal 9Alliance <pqr@9alliance.co>',
        to:      correo,
        subject: `Respuesta a tu PQR — 9 Alliance`,
        html,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('[PQR] Resend error:', data);
      return res.status(502).json({ error: 'Error enviando email', detail: data });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err: any) {
    console.error('[PQR] fetch error:', err);
    return res.status(500).json({ error: err.message ?? 'Error desconocido' });
  }
}
