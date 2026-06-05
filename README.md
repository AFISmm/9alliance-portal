# 9 Alliance — Portal Administrativo

Portal interno para la firma de abogados 9 Alliance. Muestra calendarios tributarios DIAN 2026, calendario de seguridad social (PILA) y gestión básica de clientes.

## Requisitos

- Python 3.10+
- Cuenta en [Streamlit Community Cloud](https://share.streamlit.io) (para despliegue)

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/9alliance-portal.git
cd 9alliance-portal

# 2. Crear entorno virtual
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Correr la app
streamlit run app.py
```

La app queda disponible en `http://localhost:8501`.

## Credenciales de prueba

| Usuario | Contraseña | Nota |
|---|---|---|
| `admin9alliance` | `Portal9Alliance!` | Usuario de prueba inicial |

> Para crear más usuarios, usa la pestaña **"Registrarse"** dentro de la app.

## Agregar nuevos usuarios manualmente

Genera el hash de una contraseña ejecutando:

```python
import bcrypt
print(bcrypt.hashpw("TuContraseña".encode(), bcrypt.gensalt(12)).decode())
```

Luego agrega la entrada en `config.yaml`:

```yaml
credentials:
  usernames:
    nuevo_usuario:
      email: correo@ejemplo.com
      name: Nombre Completo
      password: $2b$12$HASH_GENERADO_AQUI
```

## Logo

El logo actual (`assets/logo.svg`) es un **placeholder provisional** con el monograma "9A".  
Para reemplazarlo por el logo oficial: guardar el archivo en `assets/logo.svg` manteniendo el mismo nombre.

## Despliegue en Streamlit Community Cloud

1. Subir el repositorio a GitHub (público o privado).
2. Ir a [share.streamlit.io](https://share.streamlit.io) → **New app**.
3. Seleccionar el repo, rama `main`, archivo `app.py`.
4. Click **Deploy**.

> **Importante:** `config.yaml` contiene contraseñas hasheadas y se sube al repo.  
> Nunca commiteear contraseñas en texto plano. Las contraseñas están cifradas con bcrypt.

## Estructura del proyecto

```
9alliance-portal/
├── app.py                    # Entrada principal (auth + portal)
├── config.yaml               # Credenciales de acceso (bcrypt)
├── requirements.txt
├── .streamlit/
│   └── config.toml           # Tema visual
├── data/
│   ├── clients.py            # 5 clientes ficticios de prueba
│   ├── tax_calendar.py       # Calendario tributario DIAN 2026
│   └── social_security.py    # Calendario seguridad social PILA
├── assets/
│   └── logo.svg              # Logo (provisional — reemplazar con el oficial)
└── README.md
```

## Notas legales

Las fechas del calendario tributario son informativas. Las fechas exactas dependen del último dígito (o dos últimos dígitos) del NIT. Verificar siempre contra el calendario oficial DIAN vigente.
