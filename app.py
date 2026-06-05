import streamlit as st
import streamlit_authenticator as stauth
import yaml
from yaml.loader import SafeLoader
from pathlib import Path

from data.clients import CLIENTS, Client
from data.tax_calendar import iva_bimestral_2026, retencion_fuente
from data.social_security import seguridad_social_2026
from data.tax_calendar_nit import (
    get_nit_digitos,
    get_iva_fecha,
    get_retencion_grupo,
    RENTA_PRIMERA_CUOTA,
    RENTA_SEGUNDA_CUOTA,
)

st.set_page_config(
    page_title="9 Alliance — Portal Administrativo",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ──────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* Sidebar */
[data-testid="stSidebar"] { background-color: #1B2A4A !important; }
[data-testid="stSidebar"] * { color: #F8F7F4 !important; }
[data-testid="stSidebar"] hr { border-color: #C9A84C55; }
[data-testid="stSidebar"] .stButton > button {
    background: transparent;
    border: 1px solid #C9A84C44;
    color: #F8F7F4 !important;
    text-align: left;
    width: 100%;
    font-size: 0.85rem;
    padding: 6px 10px;
    margin-bottom: 4px;
}
[data-testid="stSidebar"] .stButton > button:hover {
    background: #C9A84C22;
    border-color: #C9A84C88;
}
[data-testid="stSidebar"] .active-client > button {
    background: #C9A84C33 !important;
    border-color: #C9A84C !important;
    font-weight: 700 !important;
}
/* Section labels */
.section-label {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #C9A84C;
    font-weight: 700;
    margin: 14px 0 6px;
}
/* Calendar cards */
.cal-card {
    background: #fff;
    border-left: 4px solid #C9A84C;
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.cal-card.pending { border-left-color: #CBD5E1; }
.cal-card .date-exact { color: #1B2A4A; font-weight: 700; font-size: 1rem; }
.cal-card .date-range { color: #6B7280; font-size: 0.8rem; }
.cal-card .label { font-weight: 600; margin-bottom: 4px; }
/* Welcome screen */
.welcome-box {
    text-align: center;
    padding: 60px 20px;
    color: #6B7280;
}
/* Header strip */
.client-header {
    background: #1B2A4A;
    color: #F8F7F4;
    border-radius: 8px;
    padding: 16px 22px;
    margin-bottom: 22px;
}
</style>
""", unsafe_allow_html=True)

# ── Auth ──────────────────────────────────────────────────────────────────────
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


# ── Sidebar ───────────────────────────────────────────────────────────────────
def render_sidebar():
    with st.sidebar:
        logo_path = Path("assets/logo.svg")
        if logo_path.exists():
            st.image(str(logo_path), width=160)

        st.markdown("---")
        st.markdown('<p class="section-label">Clientes</p>', unsafe_allow_html=True)

        selected = st.session_state.get("selected_client")
        for client in CLIENTS:
            is_active = selected == client.id
            container_class = "active-client" if is_active else ""
            with st.container():
                st.markdown(f'<div class="{container_class}">', unsafe_allow_html=True)
                if st.button(
                    ("▶ " if is_active else "") + client.nombre,
                    key=f"btn_{client.id}",
                    use_container_width=True,
                ):
                    if is_active:
                        st.session_state["selected_client"] = None
                    else:
                        st.session_state["selected_client"] = client.id
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("---")
        authenticator.logout("Cerrar sesión", location="sidebar")


# ── Welcome (no client selected) ─────────────────────────────────────────────
def render_welcome():
    logo_path = Path("assets/logo.svg")
    col = st.columns([1, 2, 1])[1]
    with col:
        st.markdown("<br><br>", unsafe_allow_html=True)
        if logo_path.exists():
            st.image(str(logo_path), width=200)
        st.markdown("""
<div class='welcome-box'>
    <h2 style='color:#1B2A4A;margin-bottom:8px;'>Portal Administrativo</h2>
    <p style='font-size:1.05rem;'>
        Seleccione un cliente en el panel lateral para consultar<br/>
        sus obligaciones tributarias y de seguridad social.
    </p>
</div>
""", unsafe_allow_html=True)


# ── Client calendar ───────────────────────────────────────────────────────────
def render_client_calendar(client: Client):
    ultimo_digito, ultimos_dos = get_nit_digitos(client.nit)

    # Client header
    st.markdown(f"""
<div class='client-header'>
    <span style='font-size:0.7rem;letter-spacing:0.15em;color:#C9A84C;text-transform:uppercase;'>
        Cliente activo
    </span><br/>
    <strong style='font-size:1.3rem;'>{client.nombre}</strong>
    &nbsp;&nbsp;
    <span style='color:#CBD5E1;font-size:0.9rem;'>NIT {client.nit}</span>
    <br/>
    <span style='font-size:0.8rem;color:#94A3B8;'>
        Sector: {client.sector} &nbsp;|&nbsp;
        Contacto: {client.contacto} &nbsp;|&nbsp;
        {client.email}
    </span>
</div>
""", unsafe_allow_html=True)

    st.caption(
        f"⚠️ Fechas calculadas según el último dígito del NIT **{ultimo_digito}** "
        f"(dos últimos dígitos: **{ultimos_dos}**). "
        "Verificar siempre contra el calendario oficial DIAN vigente."
    )

    col1, col2 = st.columns([3, 2], gap="large")

    with col1:
        # ── Renta Personas Jurídicas ───────────────────────────────────────
        st.markdown("### Declaración de Renta 2026")
        st.caption("Personas Jurídicas — no Grandes Contribuyentes")

        primera = RENTA_PRIMERA_CUOTA.get(ultimo_digito, "Verificar en DIAN")
        segunda = RENTA_SEGUNDA_CUOTA.get(ultimo_digito, "Verificar en DIAN")

        st.markdown(f"""
<div class='cal-card'>
    <div class='label'>Declaración y primera cuota</div>
    <div class='date-exact'>📅 {primera}</div>
    <div class='date-range'>Rango general: 12 al 26 de mayo de 2026</div>
</div>
<div class='cal-card'>
    <div class='label'>Segunda cuota</div>
    <div class='date-exact'>📅 {segunda}</div>
    <div class='date-range'>Rango general: 9 al 23 de julio de 2026</div>
</div>
""", unsafe_allow_html=True)

        # ── IVA Bimestral ──────────────────────────────────────────────────
        st.markdown("### IVA Bimestral 2026")
        for item in iva_bimestral_2026:
            fecha, es_exacta = get_iva_fecha(item.bimestre, ultimo_digito)
            if es_exacta:
                st.markdown(f"""
<div class='cal-card'>
    <div class='label'>{item.bimestre}</div>
    <div class='date-exact'>📅 {fecha}</div>
    <div class='date-range'>Rango general: {item.vencimiento}</div>
</div>
""", unsafe_allow_html=True)
            else:
                st.markdown(f"""
<div class='cal-card pending'>
    <div class='label'>{item.bimestre}</div>
    <div class='date-exact' style='color:#94A3B8;'>⏳ {fecha}</div>
    <div class='date-range'>Fecha exacta por confirmar según DIAN</div>
</div>
""", unsafe_allow_html=True)

        # ── Retención en la Fuente ─────────────────────────────────────────
        st.markdown("### Retención en la Fuente")
        grupo = get_retencion_grupo(ultimos_dos)
        st.info(
            f"**Periodicidad:** {retencion_fuente.periodicidad}  \n"
            f"**Últimos dos dígitos del NIT:** {ultimos_dos}  \n"
            f"**Vencimiento estimado:** {grupo}  \n\n"
            f"{retencion_fuente.regla}"
        )

    with col2:
        # ── Seguridad Social PILA ──────────────────────────────────────────
        st.markdown("### Seguridad Social (PILA)")
        st.markdown(f"**Periodicidad:** {seguridad_social_2026.periodicidad}")
        st.info(
            f"**Últimos dos dígitos del NIT:** {ultimos_dos}  \n\n"
            f"{seguridad_social_2026.regla}"
        )
        st.warning(seguridad_social_2026.nota)
        st.markdown("**Meses de causación 2026:**")
        for i in range(0, 12, 3):
            cols = st.columns(3)
            for j, mes in enumerate(seguridad_social_2026.meses[i:i+3]):
                cols[j].markdown(f"`{mes}`")

    st.markdown("---")
    st.caption(
        "Las fechas de Renta e IVA con rango confirmado se calculan con base en el patrón "
        "habitual del calendario DIAN para pequeños y medianos contribuyentes. "
        "Retención en la Fuente y PILA requieren consulta del cronograma oficial vigente "
        "para los dos últimos dígitos del NIT."
    )


# ── Portal (post-login) ───────────────────────────────────────────────────────
def render_portal():
    render_sidebar()
    selected_id = st.session_state.get("selected_client")
    if selected_id:
        client = next((c for c in CLIENTS if c.id == selected_id), None)
        if client:
            render_client_calendar(client)
        else:
            render_welcome()
    else:
        render_welcome()


# ── Auth pages ────────────────────────────────────────────────────────────────
def render_auth():
    col = st.columns([1, 2, 1])[1]
    with col:
        logo_path = Path("assets/logo.svg")
        if logo_path.exists():
            st.image(str(logo_path), width=180)

        st.markdown(
            "<h1 style='text-align:center;letter-spacing:0.08em;"
            "color:#1B2A4A;font-size:1.6rem;margin:8px 0 20px;'>"
            "PORTAL ADMINISTRATIVO</h1>",
            unsafe_allow_html=True,
        )
        st.markdown("---")

        tab_login, tab_register = st.tabs(["Iniciar sesión", "Registrarse"])

        with tab_login:
            authenticator.login(
                location="main",
                fields={
                    "Form name": "Iniciar sesión",
                    "Username": "Usuario",
                    "Password": "Contraseña",
                    "Login": "Entrar",
                },
            )
            if st.session_state.get("authentication_status") is False:
                st.error("Usuario o contraseña incorrectos.")

        with tab_register:
            try:
                email_reg, _, _ = authenticator.register_user(
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
                if email_reg:
                    st.success(f"Cuenta creada para {email_reg}. Ahora puedes iniciar sesión.")
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
