import streamlit as st
import streamlit_authenticator as stauth
import yaml
from yaml.loader import SafeLoader
from pathlib import Path

from data.clients import CLIENTS
from data.tax_calendar import renta_2026, iva_bimestral_2026, retencion_fuente
from data.social_security import seguridad_social_2026

st.set_page_config(
    page_title="9 Alliance — Portal",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
[data-testid="stSidebar"] { background-color: #1B2A4A; }
[data-testid="stSidebar"] * { color: #F8F7F4 !important; }
[data-testid="stSidebar"] hr { border-color: #C9A84C44; }
[data-testid="stSidebar"] .stButton button {
    background: transparent; border: 1px solid #C9A84C44;
    color: #F8F7F4 !important; text-align: left; width: 100%;
}
[data-testid="stSidebar"] .stButton button:hover { background: #C9A84C22; }
.calendar-card {
    background: #fff; border-left: 4px solid #C9A84C;
    border-radius: 4px; padding: 10px 14px; margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.calendar-card.pending { border-left-color: #94A3B8; }
.client-card {
    background: #1B2A4A; border: 1px solid #C9A84C44;
    border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;
    color: #F8F7F4;
}
.section-title {
    font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: #C9A84C; font-weight: 600; margin: 16px 0 6px;
}
</style>
""", unsafe_allow_html=True)

# ── Auth setup ───────────────────────────────────────────────────────────────
CONFIG_PATH = Path("config.yaml")

with open(CONFIG_PATH) as f:
    config = yaml.load(f, Loader=SafeLoader)

authenticator = stauth.Authenticate(
    config["credentials"],
    config["cookie"]["name"],
    config["cookie"]["key"],
    config["cookie"]["expiry_days"],
)


def save_config():
    with open(CONFIG_PATH, "w") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)


# ── Sidebar content (shown after login) ─────────────────────────────────────
def render_sidebar():
    with st.sidebar:
        logo_path = Path("assets/logo.svg")
        if logo_path.exists():
            st.image(str(logo_path), width=160)
        else:
            st.markdown("## 9 Alliance")

        st.markdown("---")
        st.markdown('<p class="section-title">Navegación</p>', unsafe_allow_html=True)
        st.markdown("🏠 **Inicio** — Calendarios")

        st.markdown("---")
        st.markdown('<p class="section-title">Clientes</p>', unsafe_allow_html=True)

        selected = st.session_state.get("selected_client")
        for client in CLIENTS:
            label = f"**{client.nombre}**\n\nNIT {client.nit}"
            if st.button(client.nombre, key=f"btn_{client.id}"):
                if selected == client.id:
                    st.session_state["selected_client"] = None
                else:
                    st.session_state["selected_client"] = client.id
            if selected == client.id:
                st.markdown(
                    f"""<div class='client-card'>
                        <strong>{client.nombre}</strong><br/>
                        NIT: {client.nit}<br/>
                        Contacto: {client.contacto}<br/>
                        Correo: {client.email}<br/>
                        Teléfono: {client.telefono}<br/>
                        Sector: {client.sector}
                    </div>""",
                    unsafe_allow_html=True,
                )

        st.markdown("---")
        authenticator.logout("Cerrar sesión", location="sidebar")


# ── Calendar sections ────────────────────────────────────────────────────────
def render_calendars():
    st.markdown("## Calendarios Tributario y de Seguridad Social — 2026")
    st.caption(
        "⚠️ Las fechas exactas dependen del último dígito (o dos últimos dígitos) del NIT. "
        "Verificar siempre contra el calendario oficial DIAN vigente."
    )

    col1, col2 = st.columns([3, 2], gap="large")

    with col1:
        # Renta Personas Jurídicas
        st.markdown("### 📋 Declaración de Renta — Personas Jurídicas 2026")
        st.caption("Empresas que NO son Grandes Contribuyentes")
        for item in renta_2026:
            st.markdown(
                f"""<div class='calendar-card'>
                    <strong>{item.obligacion}</strong><br/>
                    📅 {item.vencimiento}<br/>
                    <small>Fecha exacta según último dígito del NIT</small>
                </div>""",
                unsafe_allow_html=True,
            )

        # IVA Bimestral
        st.markdown("### 🧾 IVA Bimestral 2026")
        for item in iva_bimestral_2026:
            css_class = "calendar-card" if item.exacta else "calendar-card pending"
            nota = "" if item.exacta else " &nbsp;⚠️ <em>Fecha exacta por confirmar según NIT</em>"
            st.markdown(
                f"""<div class='{css_class}'>
                    <strong>{item.bimestre}</strong><br/>
                    📅 {item.vencimiento}{nota}
                </div>""",
                unsafe_allow_html=True,
            )

        # Retención en la Fuente
        st.markdown("### 🔁 Retención en la Fuente")
        st.info(
            f"**Periodicidad:** {retencion_fuente.periodicidad}\n\n"
            f"{retencion_fuente.regla}"
        )

    with col2:
        # Seguridad Social PILA
        st.markdown("### 🏥 Seguridad Social (PILA)")
        st.markdown(f"**Periodicidad:** {seguridad_social_2026.periodicidad}")
        st.markdown(seguridad_social_2026.regla)
        st.warning(seguridad_social_2026.nota)

        st.markdown("**Meses de causación 2026:**")
        meses_grid = ""
        for i, mes in enumerate(seguridad_social_2026.meses):
            meses_grid += f"`{mes}`  "
            if (i + 1) % 3 == 0:
                meses_grid += "\n\n"
        st.markdown(meses_grid)

        st.info(
            "Los días exactos de cada mes se pagan en el mes siguiente según "
            "el cronograma oficial del operador PILA (Aportes en Línea / SOI)."
        )


# ── Main portal ──────────────────────────────────────────────────────────────
def render_portal():
    render_sidebar()
    render_calendars()


# ── Auth pages ───────────────────────────────────────────────────────────────
def render_auth():
    col_center = st.columns([1, 2, 1])[1]
    with col_center:
        logo_path = Path("assets/logo.svg")
        if logo_path.exists():
            st.image(str(logo_path), width=180)
        st.markdown("## Portal Administrativo")
        st.markdown("---")

        tab_login, tab_register = st.tabs(["Iniciar sesión", "Registrarse"])

        with tab_login:
            authenticator.login(location="main", fields={
                "Form name": "Iniciar sesión",
                "Username": "Usuario",
                "Password": "Contraseña",
                "Login": "Entrar",
            })
            if st.session_state.get("authentication_status") is False:
                st.error("Usuario o contraseña incorrectos.")

        with tab_register:
            try:
                (
                    email_registered,
                    username_registered,
                    name_registered,
                ) = authenticator.register_user(
                    location="main",
                    pre_authorized=None,
                    captcha=False,
                    fields={
                        "Form name":       "Crear cuenta",
                        "First name":      "Nombre",
                        "Last name":       "Apellido",
                        "Email":           "Correo electrónico",
                        "Username":        "Nombre de usuario",
                        "Password":        "Contraseña (mín. 8 caracteres)",
                        "Repeat password": "Confirmar contraseña",
                        "Password hint":   "Pista de contraseña (opcional)",
                        "Register":        "Registrarse",
                    },
                )
                if email_registered:
                    st.success(f"✅ Cuenta creada para {email_registered}. Ahora puedes iniciar sesión.")
                    save_config()
            except stauth.RegisterError as e:
                st.error(str(e))
            except Exception as e:
                st.error(f"Error al registrarse: {e}")


# ── Entry point ───────────────────────────────────────────────────────────────
if st.session_state.get("authentication_status") is True:
    render_portal()
else:
    render_auth()
