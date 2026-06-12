from dataclasses import dataclass, field
from typing import List


@dataclass
class Client:
    id: str
    nombre: str
    nit: str
    contacto: str
    email: str
    telefono: str
    sector: str
    ultimo_digito_nit: str
    obligaciones: List[str] = field(
        default_factory=lambda: ["renta_pj", "iva_bimestral", "retencion", "pila"]
    )
    notas: str = ""


CLIENTS: List[Client] = [
    Client(
        id="c001",
        nombre="9ALLIANCE SAS BIC",
        nit="900.524.213-6",
        contacto="",
        email="",
        telefono="",
        sector="Servicios",
        ultimo_digito_nit="6",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
    Client(
        id="c002",
        nombre="ILC SAS BIC",
        nit="830.053.483-2",
        contacto="",
        email="",
        telefono="",
        sector="Servicios",
        ultimo_digito_nit="2",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
]

CLIENTS_MAP: dict = {c.id: c for c in CLIENTS}
