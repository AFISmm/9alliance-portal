"""
Fechas exactas de vencimiento por NIT — DIAN 2026.
Patrón habitual para pequeños y medianos contribuyentes (no Grandes Contribuyentes).
Confirmar siempre con la Resolución DIAN vigente para el período gravable 2026.
"""


def get_nit_digitos(nit: str) -> tuple[str, str]:
    """
    Extrae el último dígito y los dos últimos dígitos del NIT
    (sin incluir el dígito de verificación).
    Ej: '901.234.567-3' → ('7', '67')
    """
    nit_num = nit.replace(".", "").replace(" ", "").split("-")[0]
    return nit_num[-1], nit_num[-2:]


# ── Declaración de Renta — Personas Jurídicas 2026 ────────────────────────────
# Rango base: 12 al 26 de mayo (primera cuota) | 9 al 23 de julio (segunda cuota)

RENTA_PRIMERA_CUOTA: dict[str, str] = {
    "1": "12 de mayo de 2026",
    "2": "13 de mayo de 2026",
    "3": "14 de mayo de 2026",
    "4": "15 de mayo de 2026",
    "5": "18 de mayo de 2026",
    "6": "19 de mayo de 2026",
    "7": "20 de mayo de 2026",
    "8": "21 de mayo de 2026",
    "9": "22 de mayo de 2026",
    "0": "26 de mayo de 2026",
}

RENTA_SEGUNDA_CUOTA: dict[str, str] = {
    "1": "9 de julio de 2026",
    "2": "10 de julio de 2026",
    "3": "13 de julio de 2026",
    "4": "14 de julio de 2026",
    "5": "15 de julio de 2026",
    "6": "16 de julio de 2026",
    "7": "17 de julio de 2026",
    "8": "21 de julio de 2026",
    "9": "22 de julio de 2026",
    "0": "23 de julio de 2026",
}


# ── IVA Bimestral 2026 ────────────────────────────────────────────────────────
# Rango base: 10 al 24 de marzo | 12 al 26 de mayo | 9 al 23 de julio

IVA_ENE_FEB: dict[str, str] = {
    "1": "10 de marzo de 2026",
    "2": "11 de marzo de 2026",
    "3": "12 de marzo de 2026",
    "4": "13 de marzo de 2026",
    "5": "16 de marzo de 2026",
    "6": "17 de marzo de 2026",
    "7": "18 de marzo de 2026",
    "8": "19 de marzo de 2026",
    "9": "20 de marzo de 2026",
    "0": "24 de marzo de 2026",
}

IVA_MAR_ABR = RENTA_PRIMERA_CUOTA   # comparte rango 12–26 mayo
IVA_MAY_JUN = RENTA_SEGUNDA_CUOTA   # comparte rango 9–23 julio


def get_iva_fecha(bimestre_key: str, ultimo_digito: str) -> tuple[str, bool]:
    """
    Retorna (fecha_str, es_exacta).
    es_exacta=False cuando la fecha aún no está publicada por la DIAN.
    """
    tablas = {
        "Enero–Febrero":        (IVA_ENE_FEB, True),
        "Marzo–Abril":          (IVA_MAR_ABR, True),
        "Mayo–Junio":           (IVA_MAY_JUN, True),
        "Julio–Agosto":         (None, False),
        "Septiembre–Octubre":   (None, False),
        "Noviembre–Diciembre":  (None, False),
    }
    tabla, exacta = tablas.get(bimestre_key, (None, False))
    if exacta and tabla:
        return tabla.get(ultimo_digito, "Verificar DIAN"), True
    meses_pendientes = {
        "Julio–Agosto": "Septiembre 2026",
        "Septiembre–Octubre": "Noviembre 2026",
        "Noviembre–Diciembre": "Enero 2027",
    }
    return meses_pendientes.get(bimestre_key, "Por confirmar"), False


# ── Retención en la Fuente — regla mensual ────────────────────────────────────
# Vence entre el segundo y tercer decenio del mes siguiente.
# Fecha exacta según los DOS ÚLTIMOS dígitos del NIT.
# La tabla completa (100 combinaciones) debe obtenerse del calendario DIAN vigente.

def get_retencion_grupo(ultimos_dos: str) -> str:
    """
    Retorna una descripción aproximada de la quincena de vencimiento
    basada en los dos últimos dígitos del NIT.
    """
    n = int(ultimos_dos)
    if n <= 9:
        return "alrededor del 9 al 10 del mes siguiente"
    elif n <= 19:
        return "alrededor del 11 al 12 del mes siguiente"
    elif n <= 29:
        return "alrededor del 13 al 14 del mes siguiente"
    elif n <= 39:
        return "alrededor del 15 al 16 del mes siguiente"
    elif n <= 49:
        return "alrededor del 17 al 18 del mes siguiente"
    elif n <= 59:
        return "alrededor del 19 al 20 del mes siguiente"
    elif n <= 69:
        return "alrededor del 21 al 22 del mes siguiente"
    else:
        return "alrededor del 23 del mes siguiente"
