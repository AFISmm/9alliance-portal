from dataclasses import dataclass
from typing import List


@dataclass
class RentaItem:
    obligacion: str
    vencimiento: str
    depende_nit: str  # "ultimo" = último dígito


@dataclass
class IvaItem:
    bimestre: str
    vencimiento: str
    exacta: bool  # False = fecha por confirmar según NIT


@dataclass
class RetencionFuente:
    periodicidad: str
    regla: str


renta_2026: List[RentaItem] = [
    RentaItem(
        obligacion="Declaración y primera cuota",
        vencimiento="12 al 26 de mayo de 2026",
        depende_nit="ultimo",
    ),
    RentaItem(
        obligacion="Segunda cuota",
        vencimiento="9 al 23 de julio de 2026",
        depende_nit="ultimo",
    ),
]

iva_bimestral_2026: List[IvaItem] = [
    IvaItem(bimestre="Enero–Febrero",       vencimiento="10 al 24 de marzo de 2026",  exacta=True),
    IvaItem(bimestre="Marzo–Abril",         vencimiento="12 al 26 de mayo de 2026",   exacta=True),
    IvaItem(bimestre="Mayo–Junio",          vencimiento="9 al 23 de julio de 2026",   exacta=True),
    IvaItem(bimestre="Julio–Agosto",        vencimiento="Septiembre 2026",            exacta=False),
    IvaItem(bimestre="Septiembre–Octubre",  vencimiento="Noviembre 2026",             exacta=False),
    IvaItem(bimestre="Noviembre–Diciembre", vencimiento="Enero 2027",                 exacta=False),
]

retencion_fuente = RetencionFuente(
    periodicidad="Mensual",
    regla="Vencimientos entre el segundo y tercer decenio del mes siguiente, según los dos últimos dígitos del NIT.",
)
