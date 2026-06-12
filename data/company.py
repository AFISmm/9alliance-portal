from dataclasses import dataclass


@dataclass
class Company:
    razon_social: str
    tipo: str
    nit: str
    direccion: str
    ciudad: str
    telefono: str
    email: str
    representante: str


# Datos de prueba — reemplazar con información real antes de producción
COMPANY = Company(
    razon_social="9 Alliance",
    tipo="Firma de abogados",
    nit="901.400.900-5",
    direccion="Calle 100 # 19-61, Oficina 802",
    ciudad="Bogotá D.C.",
    telefono="(601) 743 9000",
    email="contacto@9alliance.test",
    representante="(por definir)",
)
