export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'Servicio de correo no configurado' });

  const { toEmail, employeeName, certType, pdfBase64, issuerName } = req.body ?? {};

  if (!toEmail || !certType || !pdfBase64) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const certLabels: Record<string, string> = {
    laboral:   'Certificado Laboral',
    ingresos:  'Certificado de Ingresos y Retenciones',
    activo:    'Certificado de Empleado Activo',
  };
  const certLabel = certLabels[certType] ?? 'Certificado';

  const emailBody = {
    from:    'Portal 9 Alliance <noreply@9alliance.co>',
    to:      [toEmail],
    subject: `${certLabel} — 9 Alliance`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; background: #0d1829; padding: 32px; border-radius: 12px; max-width: 540px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #1B2A4A; border: 1px solid #243560; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 20px; font-weight: 700; color: #C9A84C;">9A</div>
          <h2 style="color: #F8F7F4; margin: 12px 0 4px; font-size: 18px;">9 Alliance</h2>
          <p style="color: #7C8A9C; font-size: 13px; margin: 0;">Portal Administrativo</p>
        </div>
        <div style="background: #1B2A4A; border: 1px solid #243560; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #AEBCCD; font-size: 13px; margin: 0 0 8px;">Estimado/a ${employeeName ?? toEmail},</p>
          <p style="color: #F8F7F4; font-size: 14px; margin: 0;">Se adjunta su <strong style="color: #C9A84C;">${certLabel}</strong> solicitado a través del portal de 9 Alliance.</p>
        </div>
        <p style="color: #7C8A9C; font-size: 11.5px; text-align: center; margin: 0;">Emitido por ${issuerName ?? '9 Alliance SAS BIC'} · Documento generado electrónicamente</p>
      </div>
    `,
    attachments: [
      {
        filename: `${certLabel.replace(/\s/g, '_')}.pdf`,
        content:  pdfBase64,
        encoding: 'base64',
      },
    ],
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data.message ?? 'Error enviando correo' });
    }
    return res.status(200).json({ success: true, id: data.id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? 'Error interno' });
  }
}
