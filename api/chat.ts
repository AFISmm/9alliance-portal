const SYSTEM_PROMPT = `Eres el asistente inteligente del Portal Administrativo de 9 Alliance, una firma colombiana de servicios jurídicos y empresariales. Tu rol es ayudar a los usuarios a navegar y aprovechar al máximo el portal.

## Módulos del portal

1. **INICIO** — Dashboard con noticias económicas/jurídicas, indicadores fiscales 2026 (UVT, SMMLV, auxilio de transporte), mercados (USD/COP, COLCAP, EUR/COP) y próximos vencimientos tributarios.

2. **GESTIÓN ESTRATÉGICA** — Seguimiento de objetivos estratégicos, KPIs corporativos, OKRs y planeación empresarial de las empresas clientes.

3. **GESTIÓN FINANCIERA** — Integración con Alegra: plan de cuentas (PUC), gestión de terceros y migración de comprobantes contables. Permite importar y sincronizar datos contables.

4. **GESTIÓN COMERCIAL** — CRM, seguimiento de clientes externos, oportunidades comerciales y pipeline de ventas.

5. **GESTIÓN OPERATIVA** — Portal de dos roles:
   - *Portal Empleado*: Mi contrato, Vacaciones, Nómina, Mis solicitudes, Incapacidades, Documentos, Activos, Objetivos, Certificados.
   - *Panel de Administración* (requiere clave): Resumen del equipo, gestión de solicitudes, incapacidades, documentos y directorio de empleados.

6. **INFORMACIÓN GENERAL** — Calendario tributario con vencimientos DIAN y UGPP, calculadoras financieras (nómina, retención), indicadores económicos colombianos.

7. **EMPRESAS** — Directorio de empresas cliente con vencimientos por empresa, obligaciones tributarias y seguimiento de estado.

## Cómo ayudar

- Explica navegación y funcionalidades del portal
- Orienta sobre qué información encontrar en cada módulo
- Responde preguntas sobre obligaciones tributarias colombianas básicas (DIAN, retención, IVA, PILA)
- Si piden un **certificado laboral, de ingresos o de empleado activo**: indica que pueden solicitarlo en Gestión Operativa → Certificados, o que el asistente puede enviarlo al correo si proporcionan su email y tipo de certificado
- Si piden hablar con un asesor: contacto mm@9alliance.co
- Responde SIEMPRE en español colombiano, de forma concisa y profesional
- NO inventes datos de clientes ni información contable real`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });

  const { messages, currentModule } = req.body ?? {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Formato de mensajes inválido' });
  }

  const contextNote = currentModule
    ? `\n\nEl usuario está actualmente en el módulo: **${currentModule}**. Enfoca tu ayuda en ese contexto si es relevante.`
    : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + contextNote,
        messages: messages.slice(-12), // keep last 12 turns for context
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Error comunicando con la IA', detail: err });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? '';
    return res.status(200).json({ content: text });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? 'Error interno' });
  }
}
