"""
Generador de VencimientoItem por cliente.
Combina calendarios DIAN 2026 y PILA con el NIT de cada cliente
para producir fechas exactas (o aproximadas) por obligación.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from data.clients import Client

from data.tax_calendar import iva_bimestral_2026
from data.tax_calendar_nit import (
    get_nit_digitos,
    get_iva_fecha,
    RENTA_PRIMERA_CUOTA,
    RENTA_SEGUNDA_CUOTA,
)

MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

MESES_NOMBRE = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

OBLIGACION_COLORES = {
    "renta_pj":     "#1B2A4A",
    "iva_bimestral": "#7C3AED",
    "retencion":    "#D97706",
    "pila":         "#059669",
    "ica":          "#DC2626",
    "exogena":      "#6B7280",
}


def parse_fecha_es(texto: str) -> Optional[date]:
    """'12 de mayo de 2026' → date(2026, 5, 12). Retorna None si no puede parsear."""
    m = re.match(r"(\d+)\s+de\s+(\w+)\s+de\s+(\d+)", texto.lower().strip())
    if m:
        mes = MESES_ES.get(m.group(2))
        if mes:
            try:
                return date(int(m.group(3)), mes, int(m.group(1)))
            except ValueError:
                return None
    return None


def _dia_aprox_nit(ultimos_dos: str) -> int:
    """
    Devuelve el día aproximado de vencimiento según los dos últimos dígitos del NIT.
    Aplica para Retención en la Fuente y PILA (vencen el mes siguiente).
    Fuente: patrón habitual del calendario DIAN — confirmar con cronograma oficial.
    """
    n = int(ultimos_dos)
    if n <= 9:   return 9
    if n <= 19:  return 11
    if n <= 29:  return 13
    if n <= 39:  return 15
    if n <= 49:  return 17
    if n <= 59:  return 19
    if n <= 69:  return 21
    return 23


def _safe_day(year: int, month: int, day: int) -> date:
    """Crea una fecha ajustando el día si supera el máximo del mes."""
    import calendar as cal
    max_day = cal.monthrange(year, month)[1]
    return date(year, month, min(day, max_day))


@dataclass
class VencimientoItem:
    key: str                         # ID único para session_state
    client_id: str
    client_nombre: str
    obligacion_id: str
    obligacion_nombre: str
    periodo: str                     # "Enero–Febrero", "2026", "Marzo 2026", etc.
    fecha_exacta: Optional[date]     # None si aún no está publicada / es pendiente
    mes_aproximado: Optional[str]    # "Septiembre 2026" para fechas pendientes DIAN
    rango_texto: str                 # Texto display: "12 al 26 de mayo de 2026"
    es_aproximada: bool = False      # True = estimada por NIT (no cronograma oficial)
    color: str = "#1B2A4A"


def get_vencimientos_cliente(client: "Client") -> List[VencimientoItem]:
    ultimo, dos = get_nit_digitos(client.nit)
    items: List[VencimientoItem] = []

    # ── Renta Personas Jurídicas ───────────────────────────────────────────────
    if "renta_pj" in client.obligaciones:
        primera_str = RENTA_PRIMERA_CUOTA.get(ultimo, "")
        items.append(VencimientoItem(
            key=f"{client.id}_renta_primera_2026",
            client_id=client.id,
            client_nombre=client.nombre,
            obligacion_id="renta_pj",
            obligacion_nombre="Renta — 1ª cuota",
            periodo="2026",
            fecha_exacta=parse_fecha_es(primera_str) if primera_str else None,
            mes_aproximado=None,
            rango_texto="12 al 26 de mayo de 2026",
            color=OBLIGACION_COLORES["renta_pj"],
        ))
        segunda_str = RENTA_SEGUNDA_CUOTA.get(ultimo, "")
        items.append(VencimientoItem(
            key=f"{client.id}_renta_segunda_2026",
            client_id=client.id,
            client_nombre=client.nombre,
            obligacion_id="renta_pj",
            obligacion_nombre="Renta — 2ª cuota",
            periodo="2026",
            fecha_exacta=parse_fecha_es(segunda_str) if segunda_str else None,
            mes_aproximado=None,
            rango_texto="9 al 23 de julio de 2026",
            color=OBLIGACION_COLORES["renta_pj"],
        ))

    # ── IVA Bimestral ──────────────────────────────────────────────────────────
    if "iva_bimestral" in client.obligaciones:
        for iva in iva_bimestral_2026:
            fecha_str, es_exacta = get_iva_fecha(iva.bimestre, ultimo)
            # Generar un slug limpio para la key
            slug = re.sub(r"[^a-z0-9]", "_", iva.bimestre.lower().replace("–", "_"))
            slug = re.sub(r"_+", "_", slug).strip("_")
            items.append(VencimientoItem(
                key=f"{client.id}_iva_{slug}_2026",
                client_id=client.id,
                client_nombre=client.nombre,
                obligacion_id="iva_bimestral",
                obligacion_nombre=f"IVA {iva.bimestre}",
                periodo=iva.bimestre,
                fecha_exacta=parse_fecha_es(fecha_str) if es_exacta else None,
                mes_aproximado=fecha_str if not es_exacta else None,
                rango_texto=iva.vencimiento,
                color=OBLIGACION_COLORES["iva_bimestral"],
            ))

    # ── Retención en la Fuente (mensual) ───────────────────────────────────────
    if "retencion" in client.obligaciones:
        dia = _dia_aprox_nit(dos)
        for mes_caus in range(1, 13):
            vence_mes = mes_caus % 12 + 1
            vence_year = 2026 if mes_caus < 12 else 2027
            nombre_mes = MESES_NOMBRE[mes_caus - 1]
            items.append(VencimientoItem(
                key=f"{client.id}_retefte_m{mes_caus:02d}_2026",
                client_id=client.id,
                client_nombre=client.nombre,
                obligacion_id="retencion",
                obligacion_nombre=f"Ret. Fuente — {nombre_mes}",
                periodo=f"{nombre_mes} 2026",
                fecha_exacta=_safe_day(vence_year, vence_mes, dia),
                mes_aproximado=None,
                rango_texto=f"Aprox. día {dia} del mes siguiente (NIT: ..{dos})",
                es_aproximada=True,
                color=OBLIGACION_COLORES["retencion"],
            ))

    # ── PILA — Seguridad Social (mensual) ──────────────────────────────────────
    if "pila" in client.obligaciones:
        dia = _dia_aprox_nit(dos)
        for mes_caus in range(1, 13):
            vence_mes = mes_caus % 12 + 1
            vence_year = 2026 if mes_caus < 12 else 2027
            nombre_mes = MESES_NOMBRE[mes_caus - 1]
            items.append(VencimientoItem(
                key=f"{client.id}_pila_m{mes_caus:02d}_2026",
                client_id=client.id,
                client_nombre=client.nombre,
                obligacion_id="pila",
                obligacion_nombre=f"PILA — {nombre_mes}",
                periodo=f"{nombre_mes} 2026",
                fecha_exacta=_safe_day(vence_year, vence_mes, dia),
                mes_aproximado=None,
                rango_texto=f"Aprox. día {dia} del mes siguiente (NIT: ..{dos})",
                es_aproximada=True,
                color=OBLIGACION_COLORES["pila"],
            ))

    return items


def get_vencimientos_todos() -> List[VencimientoItem]:
    from data.clients import CLIENTS
    result: List[VencimientoItem] = []
    for client in CLIENTS:
        result.extend(get_vencimientos_cliente(client))
    return result


def compute_estado_auto(v: VencimientoItem) -> str:
    """Estado calculado automáticamente según la fecha actual."""
    if v.fecha_exacta is None:
        return "pendiente"
    today = date.today()
    diff = (v.fecha_exacta - today).days
    if diff < 0:
        return "vencido"
    if diff <= 7:
        return "proximo"
    return "pendiente"
