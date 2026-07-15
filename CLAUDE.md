# CLAUDE.md — Portal / Tablero de Control 9A

> Documento fuente para Claude Code. Describe **qué** construir, **para quién**, en **qué orden** y con **qué criterios de calidad**. Base: reunión de automatización del 8-jul-2026 (9A + Metis Intel / Alegra) y la lista de tareas priorizada asociada.
>
> **Convención:** los puntos marcados con 🔒 provienen directamente de la reunión (requisitos confirmados). Los marcados con 💡 son adiciones propuestas por Claude para que el portal sea funcional y amigable; **deben validarse con el cliente** antes de darlos por definitivos. Los marcados con ❓ son decisiones abiertas.

---

## 1. Contexto y objetivo

9A es una firma que presta servicios contables tercerizados a múltiples empresas cliente. El portal es un **tablero de control** que centraliza la operación contable, tributaria, de nómina y documental de todas esas empresas, apoyándose en **Alegra** como sistema contable (Alegra está conectado directamente con la **DIAN**).

**Objetivo del portal:** que 9A gestione y supervise, desde un solo lugar, las obligaciones y procesos de todas sus empresas cliente, con **trazabilidad de extremo a extremo**: no basta con detectar un vencimiento, hay que probar que se avisó al cliente y que se ejecutó la gestión. 🔒

**Dato clave de negocio:** 9A es el destinatario final de solo ~20–30 % de las contabilidades; en el resto, el destinatario es un tercero (el cliente). Por eso toda alerta crítica necesita un **segundo eslabón**: la notificación al cliente y el registro de esa notificación. 🔒

**Estado actual:** el portal es un prototipo/demo. La estructura de módulos existe, pero **casi todo está vacío porque aún no se ha cargado la información contable real** desde Alegra. 🔒

---

## 2. Arquitectura y stack

> El stack concreto no se definió en la reunión. Lo siguiente es una propuesta 💡 coherente con lo observado (dashboard web, integración Alegra, Microsoft 365). Ajustar a lo que ya use Metis Intel.

- **Frontend:** SPA web responsive (React + TypeScript sugerido). Debe verse bien en escritorio y móvil. 💡
- **Backend:** API REST/GraphQL con capa de servicios por integración. 💡
- **Integraciones:**
  - **Alegra API** — fuente de verdad contable: plan de cuentas, comprobantes, terceros, centros de costo, reportes financieros, saldos y movimientos. La sincronización es **bidireccional** donde aplique (p. ej. agregar una cuenta en el portal la crea en Alegra). 🔒
  - **DIAN** — a través de Alegra (no directo desde el portal). 🔒
  - **Microsoft 365 / Teams** — el cliente ya lo usa; canal válido para notificaciones. 🔒
  - **Correo electrónico** — canal principal por ser el más trazable/auditable. 🔒
  - **WhatsApp / Telegram** — canales opcionales de notificación. Telegram es el más amigable para automatización pero el menos usado. 🔒
- **Almacenamiento documental:** los soportes electrónicos viven en Alegra/DIAN; para gestión documental propia se necesita un repositorio adicional (ver §9). 🔒
- **Localización:** español (Colombia). Moneda **COP** con formato `$#.###`, fechas `dd/mm/aaaa`, zona horaria `America/Bogota`. 💡

### Principios de integración
- Toda escritura hacia Alegra debe ser **idempotente** y registrar el resultado (éxito/fallo) para reintentos. 💡
- El portal **no reemplaza** el proceso contable: con Alegra conectado a la DIAN, el proceso pasa de captura manual a **revisión/validación electrónica**. El flujo debe reflejar esa revisión, no duplicar la digitación. 🔒
- Los **flujos de aprobación son distintos por cliente**: modelarlos como configurables por empresa, no hardcodeados. 🔒

---

## 3. Roles y permisos (RBAC)

Los permisos se otorgan **por usuario y por submódulo** (cada módulo puede activarse/ocultarse por usuario). 🔒 Al crear un usuario, este queda **sincronizado con un empleado** y hereda visibilidad según su cargo. 🔒

Roles mínimos sugeridos 💡 (refinar con 9A):

| Rol | Ve / hace |
|---|---|
| **Gerencia (comando central)** | Visión global, compliance, centros de costo y rentabilidad, reportes financieros. No gestiona plan de cuentas ni comprobantes. 🔒 |
| **Coordinador** | Supervisa las contabilidades a su cargo y el cumplimiento del equipo. |
| **Contador senior** | Gestión contable completa de sus empresas asignadas. |
| **Contador junior / auxiliar** | Operación contable de sus empresas, con aprobaciones que escalan al senior/coordinador. |
| **Revisor fiscal** | Consulta y validación (donde aplique). |
| **Empleado** | Autoservicio de nómina: contrato, vacaciones, desprendibles, solicitudes, incapacidades, certificados. 🔒 |
| **Cliente (externo)** | ❓ Acceso opcional a ver **solo su propia empresa**. Evaluar en qué casos habilitarlo. 🔒 |
| **Administrador del portal** | Gestiona usuarios y permisos. 🔒 |

> Regla de oro de UX: un usuario **nunca** debe ver un módulo o dato que no le corresponde. Los menús se arman según permisos efectivos. 🔒💡

---

## 4. Modelo de datos (entidades núcleo)

> Esquema orientativo 💡. Los campos marcados 🔒 son requisitos explícitos de la reunión.

**Empresa (cliente)**
- Identificación: `nombre` 🔒, `NIT` 🔒, `correo` 🔒, `representante_legal` 🔒
- **Responsables** (nuevo, corregir formulario) 🔒: `contador`, `revisor_fiscal` (si aplica), `coordinador`, `senior`, `junior`, `representante_fiscal`
- **Caracterización** (define obligaciones) 🔒: tipo de entidad (p. ej. ESAL), régimen, si es **gran contribuyente**, superintendencia que la vigila, composición accionaria, registro de proponentes, etc.
- Relación con centros de costo y contratos.

**Obligación**
- Tipo (tributaria, regulatoria, societaria, reporte) 🔒
- `empresa`, `periodicidad`, `fecha_vencimiento`, `estado` ∈ {pendiente, próximo a vencer, presentado, vencido} 🔒
- Reglas de notificación (canal, destinatarios, anticipación). 🔒

**Vencimiento / Alerta**
- Deriva de una obligación; dispara la notificación y el ciclo de compliance (§6).

**Notificación (bitácora de envío)** 🔒
- `obligacion`, `destinatario`, `canal`, `fecha_programada`, `fecha_envío`, `estado_envío`, `evidencia`.

**Acción de compliance** 🔒
- Registro de que el equipo **ejecutó la gestión** (avisó al cliente / cargó soporte), con responsable, fecha y evidencia.

**Centro de costo** 🔒 — importado de Alegra; permite seguimiento por proyecto/unidad y **rentabilidad por contrato**.

**Contrato** 💡 — con su centro de costo asociado, para medir rentabilidad (aplica a contratos de contabilidad y a cualquier otro).

**Empleado** 🔒 — datos laborales, contrato, vacaciones, nómina, solicitudes, incapacidades, activos asignados; vinculado a un Usuario.

**Solicitud** 🔒 — de empleado (vacaciones, incapacidad, certificado, liquidación de nómina); estados {pendiente, aprobada, rechazada}; notifica al aprobador.

**Documento / Soporte** 🔒 — evidencia (p. ej. incapacidad cargada, soporte de acción). Registro + archivo cuando aplique.

**Usuario** 🔒 — `primer_nombre`, `primer_apellido`, `segundo_apellido`, `correo`, `identificación`, `contraseña`; permisos por módulo; vinculado a Empleado.

---

## 5. Módulos y funcionalidades

### 5.1 Inicio (Dashboard)
- **Reemplazar** el carrusel de noticias aleatorias de Google (relleno estético, refresco cada 10 s) por un **panel de KPIs operativos reales** 🔒💡: próximos vencimientos, alertas críticas, obligaciones por estado, solicitudes pendientes de aprobación, cumplimiento del equipo.
- Buscador global de empresas/obligaciones/empleados. 💡
- Centro de notificaciones in-app. 💡

### 5.2 Empresas
- Listado de empresas activas; alta de empresa con datos obligatorios + **responsables** + **caracterización** (§4). 🔒
- Detalle por empresa: pagos tributarios, vencimientos, estado de cada pago e historial completo. 🔒

### 5.3 Gestión financiera
- Advertencia de vencimientos próximos por empresa. 🔒
- Plan de cuentas, comprobantes y terceros sincronizados con Alegra (agregar cuenta en el portal → la crea en Alegra). 🔒
- **Centros de costo** con seguimiento por proyecto/unidad y **rentabilidad por contrato**. 🔒 (Necesidad prioritaria de gerencia.)
- Reportes financieros estándar (estados financieros) e indicadores. 🔒
- Toda liquidación/consulta se hace **desde el portal**, sin saltar a otra herramienta. 🔒
- Conciliaciones bancarias (fortaleza de Alegra) — incluir en el alcance. 🔒

### 5.4 Gestión comercial
- Módulo genérico de mercadeo/posicionamiento en redes; **no es específico para 9A**. ❓ Decidir si se mantiene, oculta o elimina para este cliente. 🔒

### 5.5 Gestión operativa
- **Nómina / empleados** (autoservicio): contrato, vacaciones, desprendibles, solicitudes, incapacidades, activos. 🔒
- Resumen administrativo de empleados: distribución por cargo/departamento, disponibilidad, incapacidades. 🔒
- Bandeja de solicitudes con aprobar / rechazar / pendiente, **con notificación al aprobador** (correo/Teams). 🔒
- Submódulos adicionales según empresa: **inventarios, procesos, contratos de servicios**. 🔒

### 5.6 Información general
- Calendario tributario con todas las obligaciones, filtrable por **cliente, obligación y estado**. 🔒
- Indicadores fiscales (informativo). 🔒
- Calculadoras: tributaria (retefuente, reteIVA, reteICA) y de nómina; el resultado de la de nómina se puede **enviar a aprobación** al encargado como una solicitud. 🔒

### 5.7 Gestión de usuarios (admin)
- Crear usuarios y asignar permisos por módulo; sincroniza con empleado. 🔒

### 5.8 Chatbot / autoservicio
- Generación de **certificados laborales**: ingresos y retenciones, y empleado activo, **con firma**. 🔒
- **Corregir:** hoy el certificado generado **no se almacena** (solo queda el registro de solicitud/descarga). Definir si debe guardarse una copia. 🔒

---

## 6. Notificaciones y compliance (núcleo del sistema) 🔒

Es la funcionalidad más importante del portal. Ciclo completo:

1. **Detección** — una obligación se acerca a su vencimiento.
2. **Alerta interna** — se notifica al responsable en 9A.
3. **Configuración por empresa** — cada empresa define: destinatarios, **canal** (correo por defecto por trazabilidad; Teams/WhatsApp/Telegram opcionales) y **anticipación** (p. ej. 10, 5 o 1 día antes). Modelar como un **cuadro editable por empresa**. 🔒
4. **Notificación al cliente** — cuando 9A no es el destinatario final, se avisa al cliente.
5. **Bitácora / log de envíos** — cada envío queda registrado (destinatario, canal, fecha, estado). 🔒
6. **Registro de la acción ejecutada** — evidencia de que el equipo hizo la gestión, visible para gerencia. La alerta no se cierra hasta que hay acción + evidencia. 🔒

**Criterio de aceptación:** desde gerencia debe poder verse, para cualquier obligación, **si se avisó, cuándo, por qué canal, a quién y quién ejecutó la acción**. 🔒

---

## 7. Datos, migración y saldos 🔒

- La migración inicial trajo **solo movimientos de 2026** (aprox. enero–mayo), **sin saldos iniciales**.
- Consecuencia: **cuentas de resultado** deberían cuadrar; **cuentas de balance no** (solo son válidos los movimientos del año, no los saldos).
- El portal debe **advertir claramente** en balances que no incluyen saldos iniciales, para evitar lecturas erróneas. 💡
- Decisión pendiente ❓: cargar histórico y saldos iniciales (p. ej. 3 años) para conciliar.

---

## 8. Mapeo de procesos 🔒

Antes de automatizar, mapear cada proceso contable manual y definir su nuevo alcance electrónico (qué se automatiza, qué queda manual, cuál es el punto de aprobación). Los **procesos de aprobación varían por cliente** → deben ser configurables. Este mapeo se hace en reuniones punto a punto con el equipo contable de 9A.

---

## 9. Gestión documental 🔒

- Los soportes electrónicos quedan en **Alegra/DIAN**; el "soporte" es el registro/identificación del documento electrónico.
- Las **incapacidades sí** se cargan a un repositorio del portal.
- Si 9A requiere gestión documental propia (guardar evidencias de documentos enviados y de acciones ejecutadas), hay que **desarrollarla**, definiendo la vía de entrada (carpeta compartida, correo) y el almacenamiento. ❓

---

## 10. Criterios de UX — "funcional y amigable para todos los usuarios" 💡

Objetivo: que un empleado que solo pide su certificado y un gerente que audita compliance encuentren el portal igual de claro.

- **Menús por rol:** cada usuario ve solo lo suyo; nada de opciones deshabilitadas confusas.
- **Estados visibles con semáforo consistente:** pendiente (gris/azul), próximo a vencer (ámbar), presentado (verde), vencido (rojo). El mismo código de color en todo el portal.
- **Vocabulario del usuario, no del sistema:** "Avisar al cliente", "Solicitar certificado", no nombres técnicos. Un mismo botón conserva su nombre en todo el flujo (el botón "Enviar aviso" produce el mensaje "Aviso enviado").
- **Empty states útiles:** cuando un módulo esté vacío (hoy es lo normal), explicar por qué y qué hacer ("Aún no hay información contable cargada para esta empresa. Conéctala con Alegra para verla aquí."), en vez de una pantalla en blanco.
- **Errores accionables:** decir qué pasó y cómo resolverlo, sin disculpas vagas.
- **Confirmación en acciones irreversibles:** liquidar, enviar avisos, aprobar/rechazar solicitudes.
- **Formularios guiados:** el alta de empresa (con responsables + caracterización) es larga; dividirla en pasos con validación por campo.
- **Búsqueda y filtros** en toda vista con listas (empresas, obligaciones, empleados, calendario).
- **Accesibilidad (piso de calidad, no negociable):** contraste WCAG AA, navegación por teclado con foco visible, responsive hasta móvil, respeto a `prefers-reduced-motion`, textos alternativos.
- **Localización correcta:** español-CO, COP, `dd/mm/aaaa`.
- **Identidad visual:** aplicar el **manual de imagen de 9A** (colores, logos, tipografías) cuando lo entreguen. Hasta entonces, un sistema de tokens neutro y sobrio; evitar la estética "plantilla por defecto".

---

## 11. Roadmap priorizado

Mapeo directo con la lista de tareas priorizada.

### P1 — Base y crítico (bloquea el resto)
1. **Cargar información contable real** desde Alegra (prerrequisito de casi todo). 🔒
2. **Verificar completitud de la migración**. 🔒
3. **Alertas de vencimiento + notificación al cliente** con cuadro configurable por empresa. 🔒
4. **Registro/evidencia del "llamado a la acción"** (compliance). 🔒
5. **Centros de costo y rentabilidad por contrato**. 🔒
6. **Corregir formulario de empresa**: responsables + caracterización. 🔒
7. **Mapeo de procesos y aprobaciones por cliente** (con equipo contable). 🔒

### P2 — Importante (tras las bases)
8. Cuadro de medios de envío por empresa + **log de envíos**. 🔒
9. Definir canal(es) de notificación. 🔒
10. Ampliar **obligaciones regulatorias y societarias** por caracterización. 🔒
11. Submódulos de operativa: **inventarios, procesos, contratos**. 🔒
12. **Notificaciones de solicitudes de nómina**. 🔒
13. **Almacenar certificados** generados. 🔒
14. **Gestión documental diferenciada** (si se requiere). ❓
15. Definir tratamiento de **saldos iniciales**. ❓

### P3 — Evaluar / estético
16. Acceso de **clientes externos** al portal. ❓
17. Aplicar **manual de imagen** de 9A.
18. Reorganizar/renombrar módulos según preferencia de 9A.
19. **Eliminar/depurar** la sección de noticias del inicio (reemplazar por KPIs). 🔒
20. Decidir el futuro del **módulo de gestión comercial** (no específico para 9A). 🔒

---

## 12. Criterios de aceptación transversales

- Ningún usuario ve datos/módulos fuera de sus permisos.
- Toda escritura a Alegra confirma resultado y es reintentable.
- Toda alerta crítica es auditable de punta a punta (aviso → canal → destinatario → acción → evidencia).
- Los balances advierten la ausencia de saldos iniciales mientras aplique.
- El portal funciona en móvil y cumple accesibilidad AA.
- Cada pantalla tiene estados de carga, vacío y error definidos.

---

## 13. Preguntas abiertas para el cliente ❓

1. ¿Se habilita acceso a clientes externos? ¿En qué casos?
2. ¿Se cargan saldos iniciales / histórico y de cuántos años?
3. ¿Se mantiene, oculta o elimina el módulo de gestión comercial?
4. ¿Se debe archivar copia de los certificados generados?
5. ¿Se requiere gestión documental propia? Si sí, ¿por qué vía entran los documentos?
6. Canal(es) de notificación por defecto y anticipaciones estándar.
7. Definición fina de roles/cargos y su matriz de permisos.
8. Entrega del manual de imagen.

---

## 14. Notas para Claude Code

- Trata este archivo como fuente de verdad; ante conflicto, prioriza los puntos 🔒.
- No inventes datos de negocio: los 💡 y ❓ requieren confirmación antes de implementarse como definitivos.
- Empieza por P1 y respeta las dependencias del roadmap.
- Antes de escribir UI, define el sistema de tokens (color/tipografía/espaciado) y los estados de componente (carga/vacío/error), siguiendo §10.
- Mantén la configuración de aprobaciones y notificaciones **por empresa**, nunca hardcodeada.
