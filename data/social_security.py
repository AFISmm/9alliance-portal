from dataclasses import dataclass, field
from typing import List


@dataclass
class SeguridadSocial:
    periodicidad: str
    regla: str
    nota: str
    meses: List[str] = field(default_factory=list)


seguridad_social_2026 = SeguridadSocial(
    periodicidad="Mensual (PILA)",
    regla="El día de vencimiento depende de los dos últimos dígitos del NIT/documento del aportante.",
    nota=(
        "Confirmar días exactos con el operador de información (Aportes en Línea / SOI). "
        "Los aportes del mes se pagan en el mes siguiente."
    ),
    meses=[
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
)
