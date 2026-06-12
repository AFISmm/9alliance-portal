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
        nombre="Andina Comercial S.A.S.",
        nit="901.234.567-3",
        contacto="María Restrepo",
        email="maria.restrepo@andinacomercial.test",
        telefono="(601) 745 1102",
        sector="Comercio",
        ultimo_digito_nit="3",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
    Client(
        id="c002",
        nombre="Tequendama Logística Ltda.",
        nit="830.456.789-1",
        contacto="Carlos Páez",
        email="carlos.paez@tequendamalog.test",
        telefono="(601) 612 8890",
        sector="Transporte",
        ultimo_digito_nit="1",
        obligaciones=["renta_pj", "retencion", "pila"],
    ),
    Client(
        id="c003",
        nombre="Quimbaya Servicios Profesionales S.A.S.",
        nit="901.987.654-0",
        contacto="Laura Gómez",
        email="laura.gomez@quimbayasp.test",
        telefono="(604) 388 2274",
        sector="Servicios",
        ultimo_digito_nit="0",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
    Client(
        id="c004",
        nombre="Pacífico Alimentos S.A.",
        nit="800.321.654-7",
        contacto="Andrés Vélez",
        email="andres.velez@pacificoalimentos.test",
        telefono="(602) 555 4417",
        sector="Alimentos",
        ultimo_digito_nit="7",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
    Client(
        id="c005",
        nombre="Sabana Tech Solutions S.A.S.",
        nit="901.555.222-9",
        contacto="Daniela Cruz",
        email="daniela.cruz@sabanatech.test",
        telefono="(601) 901 3360",
        sector="Tecnología",
        ultimo_digito_nit="9",
        obligaciones=["renta_pj", "iva_bimestral", "retencion", "pila"],
    ),
]

CLIENTS_MAP: dict = {c.id: c for c in CLIENTS}
