"""
Parámetros fiscales y laborales para las calculadoras e indicadores — 2026.

Fuentes:
  - UVT 2026: Resolución DIAN 000238 de 2025 ($52.374)
  - SMMLV 2026: Decreto 0159 de 2026 ($1.750.905)
  - Auxilio de transporte 2026: Decreto 0159 de 2026 ($249.095)
  - Retención en la fuente: ET Arts. 383, 386, 392, 401; Decreto 1625/2016
  - IVA: ET Art. 468 (tarifa general 19%)
  - ICA Bogotá: Acuerdo Distrital vigente
"""

# ── Indicadores tributarios y laborales 2026 ─────────────────────────────────

INDICADORES_2026 = {
    "uvt": {
        "nombre": "Unidad de Valor Tributario (UVT)",
        "valor": 52374,
        "nota": "Resolución DIAN 000238 de 2025",
        "vigencia": "2026",
    },
    "smmlv": {
        "nombre": "Salario Mínimo Mensual Legal Vigente (SMMLV)",
        "valor": 1750905,
        "nota": "Decreto 0159 de 2026",
        "vigencia": "2026",
    },
    "aux_transporte": {
        "nombre": "Auxilio de Transporte",
        "valor": 249095,
        "nota": "Decreto 0159 de 2026",
        "vigencia": "2026",
    },
    "tasa_usura": {
        "nombre": "Tasa de Usura (referencia)",
        "valor": None,
        "nota": "Publicada mensualmente por la Superintendencia Financiera — consultar vigente",
        "vigencia": "Mensual",
    },
}

# ── Tarifas de retención en la fuente (Renta) 2026 ───────────────────────────
# Fuente: ET Arts. 383, 386, 392, 401; Decreto 1625 de 2016. UVT 2026 = $52.374

TARIFAS_RENTA = [
    # ── Honorarios y comisiones ──────────────────────────────────────────────
    {
        "concepto": "Honorarios y comisiones — Persona natural",
        "base_uvt": 0,
        "tarifa_pct": 10.0,
        "grupo": "Honorarios y comisiones",
    },
    {
        "concepto": "Honorarios y comisiones — Persona jurídica",
        "base_uvt": 0,
        "tarifa_pct": 11.0,
        "grupo": "Honorarios y comisiones",
    },
    # ── Servicios ────────────────────────────────────────────────────────────
    {
        "concepto": "Servicios generales",
        "base_uvt": 4,
        "tarifa_pct": 4.0,
        "grupo": "Servicios",
    },
    {
        "concepto": "Servicios de aseo y vigilancia",
        "base_uvt": 4,
        "tarifa_pct": 2.0,
        "grupo": "Servicios",
    },
    {
        "concepto": "Transporte nacional de carga",
        "base_uvt": 4,
        "tarifa_pct": 1.0,
        "grupo": "Servicios",
    },
    {
        "concepto": "Transporte de pasajeros (nacional)",
        "base_uvt": 4,
        "tarifa_pct": 3.5,
        "grupo": "Servicios",
    },
    # ── Compras ──────────────────────────────────────────────────────────────
    {
        "concepto": "Compras en general",
        "base_uvt": 27,
        "tarifa_pct": 2.5,
        "grupo": "Compras",
    },
    {
        "concepto": "Bienes agrícolas sin procesamiento industrial",
        "base_uvt": 92,
        "tarifa_pct": 1.5,
        "grupo": "Compras",
    },
    {
        "concepto": "Vehículos",
        "base_uvt": 0,
        "tarifa_pct": 1.0,
        "grupo": "Compras",
    },
    # ── Arrendamientos ───────────────────────────────────────────────────────
    {
        "concepto": "Arrendamiento de bienes inmuebles",
        "base_uvt": 27,
        "tarifa_pct": 3.5,
        "grupo": "Arrendamientos",
    },
    {
        "concepto": "Arrendamiento de bienes muebles",
        "base_uvt": 0,
        "tarifa_pct": 4.0,
        "grupo": "Arrendamientos",
    },
    # ── Otros ────────────────────────────────────────────────────────────────
    {
        "concepto": "Rendimientos financieros en general",
        "base_uvt": 0,
        "tarifa_pct": 7.0,
        "grupo": "Otros",
    },
    {
        "concepto": "Contratos de construcción y urbanismo",
        "base_uvt": 0,
        "tarifa_pct": 2.0,
        "grupo": "Otros",
    },
    {
        "concepto": "Loterías, rifas, apuestas y similares",
        "base_uvt": 48,
        "tarifa_pct": 20.0,
        "grupo": "Otros",
    },
    {
        "concepto": "Enajenación de activos fijos — Persona natural",
        "base_uvt": 0,
        "tarifa_pct": 1.0,
        "grupo": "Otros",
    },
]

# ── Tabla Art. 383 ET — Retención en la fuente para asalariados 2026 ─────────
# Rangos en UVT mensuales. UVT 2026 = $52.374
# 0% hasta 95 UVT ($4.975.530); escala progresiva hasta 39%.

TABLA_RETENCION_SALARIOS = [
    {"desde_uvt": 0,   "hasta_uvt": 95,   "tarifa_pct": 0.0,
     "nota": "Hasta $4.975.530 — Sin retención"},
    {"desde_uvt": 95,  "hasta_uvt": 150,  "tarifa_pct": 19.0,
     "nota": "$4.975.530 – $7.856.100"},
    {"desde_uvt": 150, "hasta_uvt": 360,  "tarifa_pct": 28.0,
     "nota": "$7.856.100 – $18.854.640"},
    {"desde_uvt": 360, "hasta_uvt": 900,  "tarifa_pct": 33.0,
     "nota": "$18.854.640 – $47.136.600"},
    {"desde_uvt": 900, "hasta_uvt": 1800, "tarifa_pct": 35.0,
     "nota": "$47.136.600 – $94.273.200"},
    {"desde_uvt": 1800, "hasta_uvt": None, "tarifa_pct": 39.0,
     "nota": "Más de $94.273.200"},
]

# ── Tarifas de retención de IVA ───────────────────────────────────────────────
# La retención se practica sobre el IVA facturado (no sobre la base del bien/servicio).

TARIFAS_IVA = [
    {
        "concepto": "Servicios gravados prestados por personas naturales no inscritas en el régimen simple",
        "porcentaje_iva_retenido": 15.0,
        "nota": "15% del IVA facturado",
    },
    {
        "concepto": "Servicios o bienes gravados entre responsables del IVA",
        "porcentaje_iva_retenido": 15.0,
        "nota": "15% del IVA facturado (tarifa general)",
    },
    {
        "concepto": "Venta de bienes o servicios (gran contribuyente como vendedor)",
        "porcentaje_iva_retenido": 15.0,
        "nota": "15% del IVA facturado",
    },
]

IVA_TASA_GENERAL = 19.0  # % — ET Art. 468

# ── Tarifas de ICA (referencia Bogotá D.C.) ──────────────────────────────────
# Fuente: Acuerdo Distrital vigente. Las tarifas varían por municipio y CIIU.

TARIFAS_ICA_BOGOTA = [
    {"actividad": "Industria (fabricación)", "tarifa_xmil": 6.9},
    {"actividad": "Comercio al por mayor", "tarifa_xmil": 9.66},
    {"actividad": "Comercio al por menor", "tarifa_xmil": 11.04},
    {"actividad": "Servicios en general", "tarifa_xmil": 9.66},
    {"actividad": "Servicios financieros", "tarifa_xmil": 13.8},
    {"actividad": "Servicios profesionales e independientes", "tarifa_xmil": 9.66},
    {"actividad": "Actividades de la construcción", "tarifa_xmil": 4.14},
    {"actividad": "Transporte terrestre", "tarifa_xmil": 9.66},
    {"actividad": "Hoteles y restaurantes", "tarifa_xmil": 9.66},
]
