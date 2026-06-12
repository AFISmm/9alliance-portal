from dataclasses import dataclass
from typing import List


@dataclass
class Obligacion:
    id: str
    nombre: str
    periodicidad: str
    descripcion: str


OBLIGACIONES: List[Obligacion] = [
    Obligacion(
        id="renta_pj",
        nombre="Declaración de Renta",
        periodicidad="Anual",
        descripcion="Personas jurídicas — declaración y pago en dos cuotas (mayo y julio).",
    ),
    Obligacion(
        id="iva_bimestral",
        nombre="IVA Bimestral",
        periodicidad="Bimestral",
        descripcion="Declaración y pago del Impuesto al Valor Agregado cada dos meses.",
    ),
    Obligacion(
        id="retencion",
        nombre="Retención en la Fuente",
        periodicidad="Mensual",
        descripcion="Presentación y pago mensual de retenciones practicadas a terceros.",
    ),
    Obligacion(
        id="pila",
        nombre="Seguridad Social (PILA)",
        periodicidad="Mensual",
        descripcion="Aportes a salud, pensión, ARL y parafiscales vía Planilla Integrada de Liquidación de Aportes.",
    ),
    Obligacion(
        id="ica",
        nombre="ICA / ReteICA",
        periodicidad="Bimestral / Anual",
        descripcion="Impuesto de Industria y Comercio — periodicidad y tarifa según municipio.",
    ),
    Obligacion(
        id="exogena",
        nombre="Información Exógena",
        periodicidad="Anual",
        descripcion="Reporte de información tributaria a la DIAN (terceros, socios, pagos, etc.).",
    ),
]

OBLIGACIONES_MAP: dict = {o.id: o for o in OBLIGACIONES}
