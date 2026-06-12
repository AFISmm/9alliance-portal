"""
Portal Administrativo — 9 Alliance
Firma de abogados | Bogotá D.C., Colombia
"""

import calendar as cal_lib
import csv
import io
import streamlit as st
import streamlit_authenticator as stauth
import yaml
from datetime import date
from pathlib import Path
from yaml.loader import SafeLoader

from data.clients import CLIENTS
from data.company import COMPANY
from data.obligaciones import OBLIGACIONES_MAP
from data.vencimientos import (
    VencimientoItem,
    compute_estado_auto,
    get_vencimientos_cliente,
    get_vencimientos_todos,
    MESES_NOMBRE,
)
from data.social_security import seguridad_social_2026
from data.tax_calendar_nit import get_nit_digitos
from data.fiscal_params import (
    INDICADORES_2026,
    TARIFAS_RENTA,
    TARIFAS_IVA,
    TARIFAS_ICA_BOGOTA,
    IVA_TASA_GENERAL,
)

# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="9 Alliance — Portal Administrativo",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&display=swap');
/* ── Sidebar: fondo blanco, texto navy ──────────────────────────── */
[data-testid="stSidebar"] { background-color: #FFFFFF !important; }
[data-testid="stSidebar"] > div:first-child { background-color: #FFFFFF !important; }
[data-testid="stSidebar"] * { color: #1B2A4A !important; }
[data-testid="stSidebar"] hr { border-color: #E2E8F0 !important; }
[data-testid="stSidebar"] input {
    background: #F8F7F4 !important;
    color: #1B2A4A !important;
    border-color: #CBD5E1 !important;
}
/* Logo pegado al tope */
[data-testid="stSidebarContent"] { gap: 0 !important; padding: 0 !important; }
[data-testid="stSidebarHeader"] { padding: 2px 8px !important; min-height: 0 !important; height: 32px !important; }
[data-testid="stSidebarUserContent"] { padding-top: 0 !important; padding-bottom: 16px !important; margin-top: 0 !important; }

/* Botones del sidebar: sin marco, muy compactos */
[data-testid="stSidebar"] .stButton { margin: 0 !important; padding: 0 !important; }
[data-testid="stSidebar"] .element-container { margin-bottom: 0 !important; }
[data-testid="stSidebar"] [data-testid="stVerticalBlock"] { gap: 6px !important; }
[data-testid="stSidebarUserContent"] { padding-bottom: 16px !important; }
/* Nav buttons (secondary): sin marco, compactos */
[data-testid="stSidebar"] button[kind="secondary"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    color: #1B2A4A !important;
    text-align: center !important;
    justify-content: center !important;
    width: 100%;
    font-size: 0.83rem;
    padding: 2px 10px !important;
    margin: 0 !important;
    min-height: 34px !important;
    height: auto !important;
    line-height: 1.3 !important;
    border-radius: 0 !important;
    font-weight: 400;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}
[data-testid="stSidebar"] button[kind="secondary"] p {
    text-align: center !important;
    width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}
/* Sin recuadro en hover, focus ni active — solo color dorado */
[data-testid="stSidebar"] button[kind="secondary"]:hover,
[data-testid="stSidebar"] button[kind="secondary"]:focus,
[data-testid="stSidebar"] button[kind="secondary"]:active,
[data-testid="stSidebar"] button[kind="secondary"]:focus-visible {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    color: #C9A84C !important;
}
/* Botón crear cliente (primary): dorado */
[data-testid="stSidebar"] button[kind="primary"] {
    background: #C9A84C !important;
    color: #1B2A4A !important;
    font-weight: 700 !important;
    border: none !important;
    border-radius: 4px !important;
    font-size: 0.82rem !important;
    padding: 5px 10px !important;
    margin: 4px 0 !important;
    width: 100% !important;
}
/* Cliente activo — solo texto dorado, sin recuadro */
.active-client button[kind="secondary"] {
    color: #C9A84C !important;
    font-weight: 700 !important;
    background: transparent !important;
    border: none !important;
}
/* Nav activo — solo texto dorado */
.nav-active button[kind="secondary"] {
    color: #C9A84C !important;
    font-weight: 700 !important;
    background: transparent !important;
    border: none !important;
}

/* ── Section labels (sidebar) ─────────────────────────────────────── */
.section-label {
    font-size: 0.60rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9CA3AF !important;
    font-weight: 700;
    margin: 6px 0 0px;
    padding-left: 10px;
}

/* ── Company card (sidebar blanco) ───────────────────────────────── */
.company-card {
    background: #F8FAFF;
    border-radius: 6px;
    padding: 11px 13px;
    margin-bottom: 4px;
    border-left: 3px solid #C9A84C;
    border-top: 1px solid #E2E8F0;
    border-right: 1px solid #E2E8F0;
    border-bottom: 1px solid #E2E8F0;
}
.company-card .cn { font-size: 0.97rem; font-weight: 700; color: #1B2A4A !important; margin-bottom: 2px; }
.company-card .ct { font-size: 0.66rem; color: #C9A84C !important; letter-spacing: 0.08em; text-transform: uppercase; }
.company-card .cd { font-size: 0.72rem; color: #475569 !important; line-height: 1.65; margin-top: 5px; }

/* ── Área principal: fondo navy, texto claro ─────────────────────── */
/* Las cards con fondo blanco mantienen texto oscuro (definido inline) */
section.main .block-container { padding-top: 0px !important; margin-top: 0px !important; }
section.main { padding-top: 0px !important; }
[data-testid="stMainBlockContainer"] { padding-top: 12px !important; }

/* Expanders sobre fondo oscuro: fondo blanco con texto navy */
section.main details {
    background-color: #FFFFFF !important;
    border: 1px solid #C9A84C44 !important;
    border-radius: 6px !important;
}
section.main details *,
section.main details p,
section.main details label { color: #1B2A4A !important; }
section.main details summary,
section.main details summary p,
section.main details summary span { color: #1B2A4A !important; font-weight: 600 !important; }

/* Formularios sobre fondo oscuro */
section.main [data-testid="stForm"] {
    background-color: #FFFFFF !important;
    border: 1px solid #C9A84C44 !important;
    border-radius: 8px !important;
    padding: 16px !important;
}
section.main [data-testid="stForm"] *,
section.main [data-testid="stForm"] label,
section.main [data-testid="stForm"] p { color: #1B2A4A !important; }
section.main [data-testid="stForm"] input,
section.main [data-testid="stForm"] textarea,
section.main [data-testid="stForm"] select {
    color: #1B2A4A !important;
    background: #F8F7F4 !important;
}

/* Selectboxes en área principal: label blanco, widget con texto navy */
section.main [data-testid="stSelectbox"] label { color: #CBD5E1 !important; }
section.main [data-testid="stNumberInput"] label { color: #CBD5E1 !important; }
section.main [data-testid="stTextInput"] label { color: #CBD5E1 !important; }
section.main [data-testid="stRadio"] label { color: #CBD5E1 !important; }
section.main [data-testid="stRadio"] p { color: #CBD5E1 !important; }
/* Valores seleccionados dentro del widget (fondo blanco) */
[data-baseweb="select"] span,
[data-baseweb="select"] div { color: #1B2A4A !important; }
[data-baseweb="input"] input { color: #1B2A4A !important; }
[data-baseweb="textarea"] textarea { color: #1B2A4A !important; }

/* Tabs en calculadoras: texto claro */
section.main [data-testid="stTabs"] [role="tab"] { color: #CBD5E1 !important; }
section.main [data-testid="stTabs"] [role="tab"][aria-selected="true"] {
    color: #C9A84C !important;
    border-bottom-color: #C9A84C !important;
}
/* Contenido dentro de tabs: mantener sobre fondo oscuro */
section.main [data-testid="stTabContent"] > div { color: #F8F7F4; }

/* Métricas: card blanco dorado */
[data-testid="stMetric"] {
    background: #FFFFFF !important;
    border-radius: 6px !important;
    padding: 12px 14px !important;
    border-top: 3px solid #C9A84C !important;
    border: 1px solid #C9A84C44;
}
[data-testid="stMetricLabel"] p { color: #475569 !important; font-size: 0.78rem !important; }
[data-testid="stMetricValue"] { color: #1B2A4A !important; }

/* Separadores en área principal */
section.main hr { border-color: #C9A84C33 !important; }

/* ── Status badges ────────────────────────────────────────────────── */
.badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-pendiente  { background: #E2E8F0; color: #475569; }
.badge-proximo    { background: #FEF3C7; color: #92400E; }
.badge-presentado { background: #D1FAE5; color: #065F46; }
.badge-vencido    { background: #FEE2E2; color: #991B1B; }
.badge-aprox      { background: #EDE9FE; color: #5B21B6; }

/* ── Calendar grid ────────────────────────────────────────────────── */
.cal-grid { width: 100%; border-collapse: collapse; font-size: 0.82rem; table-layout: fixed; }
.cal-grid th {
    background: #1B2A4A;
    color: #F8F7F4 !important;
    padding: 7px 4px;
    text-align: center;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
}
.cal-grid td {
    border: 1px solid #E2E8F0;
    vertical-align: top;
    padding: 4px;
    min-height: 72px;
    background: #fff;
}
.cal-grid td.cal-empty { background: #F8F7F4; }
.cal-grid td.cal-today { background: #EFF6FF; }
.cal-daynum { font-size: 0.75rem; color: #9CA3AF; font-weight: 500; margin-bottom: 2px; }
.cal-daynum-today { color: #1B2A4A; font-weight: 700; }
.cal-pill {
    font-size: 0.62rem;
    border-radius: 3px;
    padding: 1px 5px;
    margin: 1px 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
    cursor: default;
}
.pill-renta_pj     { background: #1B2A4A; color: #F8F7F4; }
.pill-iva_bimestral { background: #7C3AED; color: #fff; }
.pill-retencion    { background: #D97706; color: #fff; }
.pill-pila         { background: #059669; color: #fff; }
.pill-pendiente    { opacity: 0.7; }
.pill-proximo      { border: 1px solid #F59E0B; }
.pill-presentado   { text-decoration: line-through; opacity: 0.5; }
.pill-vencido      { background: #DC2626 !important; color: #fff !important; }

/* ── Calendar cards (per-client view) ────────────────────────────── */
.cal-card {
    background: #fff;
    border-left: 4px solid #C9A84C;
    border-radius: 4px;
    padding: 11px 15px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
}
.cal-card.pending  { border-left-color: #CBD5E1; }
.cal-card.proximo  { border-left-color: #F59E0B; }
.cal-card.vencido  { border-left-color: #DC2626; }
.cal-card.presentado { border-left-color: #10B981; }
.cal-card .label   { font-weight: 600; margin-bottom: 3px; font-size: 0.88rem; }
.cal-card .date-exact { color: #1B2A4A; font-weight: 700; font-size: 0.97rem; }
.cal-card .date-range { color: #6B7280; font-size: 0.77rem; margin-top: 1px; }

/* ── Client header ───────────────────────────────────────────────── */
.client-header {
    background: #1B2A4A;
    color: #F8F7F4;
    border-radius: 8px;
    padding: 16px 22px;
    margin-bottom: 20px;
}

/* ── Welcome / Home ──────────────────────────────────────────────── */
.welcome-box { text-align: center; padding: 50px 20px; color: #6B7280; }

/* ── Indicator cards ──────────────────────────────────────────────── */
.indicator-card {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-top: 4px solid #C9A84C;
    border-radius: 6px;
    padding: 16px 18px;
    margin-bottom: 10px;
}
.indicator-card .ic-label { font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; }
.indicator-card .ic-value { font-size: 1.5rem; font-weight: 700; color: #1B2A4A; margin: 4px 0 2px; }
.indicator-card .ic-nota  { font-size: 0.71rem; color: #92400E; background: #FEF3C7; border-radius: 3px; padding: 2px 6px; }

/* ── Calculator ───────────────────────────────────────────────────── */
.calc-result {
    background: #F0FDF4;
    border-left: 4px solid #10B981;
    border-radius: 4px;
    padding: 14px 18px;
    margin-top: 14px;
}
.calc-result .cr-label { font-size: 0.78rem; color: #6B7280; }
.calc-result .cr-value { font-size: 1.35rem; font-weight: 700; color: #065F46; }
.calc-no-aplica {
    background: #FEF3C7;
    border-left: 4px solid #F59E0B;
    border-radius: 4px;
    padding: 12px 16px;
    margin-top: 14px;
    font-size: 0.88rem;
    color: #92400E;
}

/* ── Verify banner ────────────────────────────────────────────────── */
.verify-banner {
    background: #FFF7ED;
    border: 1px solid #FED7AA;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 0.8rem;
    color: #9A3412;
}

/* ── Table ────────────────────────────────────────────────────────── */
.ret-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.ret-table th { background: #1B2A4A; color: #F8F7F4; padding: 8px 10px; text-align: left; }
.ret-table td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; }
.ret-table tr:nth-child(even) td { background: #F8F7F4; }
.ret-table tr:hover td { background: #EFF6FF; }
</style>
""", unsafe_allow_html=True)

# ── Auth setup ────────────────────────────────────────────────────────────────
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


# ── Session state helpers ─────────────────────────────────────────────────────

def _init_session():
    st.session_state.setdefault("page", "inicio")
    st.session_state.setdefault("selected_client", None)
    st.session_state.setdefault("clientes_expandidos", True)
    st.session_state.setdefault("vencimiento_estados", {})
    st.session_state.setdefault("cal_year", date.today().year)
    st.session_state.setdefault("cal_month", date.today().month)
    st.session_state.setdefault("cal_filtro_cliente", "Todos")
    st.session_state.setdefault("cal_filtro_oblig", "Todas")
    st.session_state.setdefault("clientes_sesion", [])


def _get_all_clients():
    """Retorna los 5 clientes base + los creados en esta sesión."""
    return CLIENTS + st.session_state.get("clientes_sesion", [])


def _get_clients_map():
    return {c.id: c for c in _get_all_clients()}


def _get_estado(v: VencimientoItem) -> str:
    info = st.session_state["vencimiento_estados"].get(v.key, {})
    stored = info.get("estado", "auto")
    if stored == "auto" or not stored:
        return compute_estado_auto(v)
    return stored


def _set_estado(key: str, estado: str):
    st.session_state["vencimiento_estados"].setdefault(key, {})["estado"] = estado


def _get_info(key: str) -> dict:
    return st.session_state["vencimiento_estados"].get(key, {
        "estado": "auto", "fecha_presentacion": "", "nota": ""
    })


def _set_info(key: str, estado: str, fecha: str, nota: str):
    st.session_state["vencimiento_estados"][key] = {
        "estado": estado,
        "fecha_presentacion": fecha,
        "nota": nota,
    }


def _estado_badge_html(estado: str) -> str:
    labels = {
        "pendiente": "Pendiente",
        "proximo":   "Próximo",
        "presentado": "Presentado",
        "vencido":   "Vencido",
        "aprox":     "Aprox.",
    }
    return f'<span class="badge badge-{estado}">{labels.get(estado, estado.capitalize())}</span>'


def _fmt_cop(value: float) -> str:
    return f"$ {value:,.0f}".replace(",", ".")


def generate_csv_cliente(client) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Cliente", "NIT", "Obligación", "Período",
        "Fecha / Rango", "Estado", "Fecha Presentación", "Notas"
    ])
    for v in get_vencimientos_cliente(client):
        estado = _get_estado(v)
        info = _get_info(v.key)
        fecha_display = (
            v.fecha_exacta.strftime("%d/%m/%Y") if v.fecha_exacta
            else (v.mes_aproximado or "Por confirmar")
        )
        aprox_nota = " (aprox.)" if v.es_aproximada else ""
        writer.writerow([
            client.nombre,
            client.nit,
            v.obligacion_nombre,
            v.periodo,
            fecha_display + aprox_nota,
            estado,
            info.get("fecha_presentacion", ""),
            info.get("nota", ""),
        ])
    return output.getvalue()


# ── Sidebar ───────────────────────────────────────────────────────────────────

def render_sidebar():
    with st.sidebar:
        # Logo inline SVG — Playfair Display italic
        st.markdown("""
<div style="display:flex;justify-content:center;padding:4px 0 18px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="116" height="116">
  <circle cx="140" cy="140" r="136" fill="#2a2826"/>
  <circle cx="140" cy="140" r="121" fill="none" stroke="#EDE8DC" stroke-width="5.5"/>
  <text x="100" y="200"
    font-family="'Playfair Display','Cormorant Garamond',Georgia,serif"
    font-size="175" font-style="italic" font-weight="400"
    fill="#EDE8DC" text-anchor="middle">9</text>
  <text x="186" y="193"
    font-family="'Playfair Display','Cormorant Garamond',Georgia,serif"
    font-size="152" font-style="italic" font-weight="400"
    fill="#EDE8DC" text-anchor="middle">A</text>
</svg>
</div>
""", unsafe_allow_html=True)

        # ── Navegación ────────────────────────────────────────────────────
        current_page = st.session_state.get("page", "inicio")
        nav_items = [
            ("inicio",       "Inicio"),
            ("calendario",   "Calendario"),
            ("calculadoras", "Calculadoras"),
            ("indicadores",  "Indicadores"),
        ]
        for page_key, label in nav_items:
            is_active = current_page == page_key
            with st.container():
                css_class = "nav-active" if is_active else ""
                st.markdown(f'<div class="{css_class}">', unsafe_allow_html=True)
                if st.button(label, key=f"nav_{page_key}", use_container_width=True):
                    st.session_state["page"] = page_key
                    st.session_state["selected_client"] = None
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("---")

        # ── Clientes externos ─────────────────────────────────────────────
        todos_clientes = _get_all_clients()
        n_clientes = len(todos_clientes)
        expandidos = st.session_state["clientes_expandidos"]
        chevron = "▾" if expandidos else "▸"

        with st.container():
            st.markdown('<div class="">', unsafe_allow_html=True)
            if st.button(
                f"{chevron}  Clientes externos ({n_clientes})",
                key="toggle_clientes",
                use_container_width=True,
            ):
                st.session_state["clientes_expandidos"] = not expandidos
                st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)

        if st.session_state["clientes_expandidos"]:
            selected = st.session_state.get("selected_client")
            for client in todos_clientes:
                is_active = selected == client.id
                nombre_corto = client.nombre if len(client.nombre) <= 26 else client.nombre[:24] + "…"
                btn_label = nombre_corto
                with st.container():
                    st.markdown(
                        f'<div class="{"active-client" if is_active else ""}">',
                        unsafe_allow_html=True,
                    )
                    if st.button(btn_label, key=f"btn_{client.id}", use_container_width=True):
                        if is_active:
                            st.session_state["selected_client"] = None
                            st.session_state["page"] = "inicio"
                        else:
                            st.session_state["selected_client"] = client.id
                            st.session_state["page"] = f"cliente_{client.id}"
                        st.rerun()
                    st.markdown("</div>", unsafe_allow_html=True)

        # ── Crear nuevo cliente ───────────────────────────────────────────
        st.markdown("<hr style='margin:6px 0 4px 0; border-color:#E2E8F0;'>", unsafe_allow_html=True)
        if st.button("+ Crear nuevo cliente", key="btn_nuevo_cliente",
                     use_container_width=True, type="primary"):
            st.session_state["page"] = "nuevo_cliente"
            st.session_state["selected_client"] = None
            st.rerun()

        st.markdown("---")
        authenticator.logout("Cerrar sesión", location="sidebar")


# ── Página: Inicio (Dashboard) ────────────────────────────────────────────────

def render_home():
    st.markdown("## Inicio — Próximos vencimientos")
    st.caption(
        f"Hoy: **{date.today().strftime('%d/%m/%Y')}**  •  "
        "Todos los clientes  •  Orden por fecha ascendente"
    )

    todos = get_vencimientos_todos()
    today = date.today()

    # Cómputo de estados
    conteo = {"pendiente": 0, "proximo": 0, "presentado": 0, "vencido": 0}
    for v in todos:
        e = _get_estado(v)
        conteo[e] = conteo.get(e, 0) + 1

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Pendientes", conteo["pendiente"])
    c2.metric("Próximos ≤7 días", conteo["proximo"])
    c3.metric("Presentados", conteo["presentado"])
    c4.metric("Vencidos", conteo["vencido"])

    st.markdown("---")

    # Filtros rápidos
    col_f1, col_f2, col_f3 = st.columns([2, 2, 2])
    with col_f1:
        opciones_estado = ["Todos", "proximo", "vencido", "pendiente", "presentado"]
        filtro_estado = st.selectbox("Estado", opciones_estado, key="home_filtro_estado")
    with col_f2:
        nombres_clientes = ["Todos"] + [c.nombre for c in CLIENTS]
        filtro_cliente = st.selectbox("Cliente", nombres_clientes, key="home_filtro_cliente")
    with col_f3:
        oblig_opciones = ["Todas", "renta_pj", "iva_bimestral", "retencion", "pila"]
        oblig_labels = {
            "Todas": "Todas",
            "renta_pj": "Renta",
            "iva_bimestral": "IVA",
            "retencion": "Retención",
            "pila": "PILA",
        }
        filtro_oblig = st.selectbox(
            "Obligación",
            oblig_opciones,
            format_func=lambda x: oblig_labels.get(x, x),
            key="home_filtro_oblig",
        )

    # Aplicar filtros y ordenar
    filtrados = []
    for v in todos:
        estado = _get_estado(v)
        if filtro_estado != "Todos" and estado != filtro_estado:
            continue
        if filtro_cliente != "Todos" and v.client_nombre != filtro_cliente:
            continue
        if filtro_oblig != "Todas" and v.obligacion_id != filtro_oblig:
            continue
        filtrados.append((v, estado))

    # Ordenar: presentados al final, luego por fecha (None al final)
    def sort_key(item):
        v, e = item
        if e == "presentado":
            return (2, date(2099, 12, 31))
        if v.fecha_exacta is None:
            return (1, date(2099, 1, 1))
        return (0, v.fecha_exacta)

    filtrados.sort(key=sort_key)

    if not filtrados:
        st.info("No hay vencimientos que coincidan con los filtros seleccionados.")
        return

    # Tabla de vencimientos
    cols = st.columns([2.5, 3, 2, 2, 1.5])
    headers = ["Cliente", "Obligación / Período", "Fecha vencimiento", "Rango", "Estado"]
    for col, h in zip(cols, headers):
        col.markdown(f"**{h}**")
    st.markdown("<hr style='margin:4px 0 8px;border-color:#E2E8F0;'>", unsafe_allow_html=True)

    for v, estado in filtrados:
        cols = st.columns([2.5, 3, 2, 2, 1.5])
        fecha_display = (
            v.fecha_exacta.strftime("%d/%m/%Y") if v.fecha_exacta
            else (v.mes_aproximado or "Por confirmar")
        )
        aprox = " ⚠️" if v.es_aproximada else ""
        cols[0].markdown(
            f"<small style='cursor:pointer'>{v.client_nombre}</small>",
            unsafe_allow_html=True,
        )
        cols[1].markdown(f"<small>{v.obligacion_nombre}<br/><em>{v.periodo}</em></small>", unsafe_allow_html=True)
        cols[2].markdown(f"<small><strong>{fecha_display}</strong>{aprox}</small>", unsafe_allow_html=True)
        cols[3].markdown(f"<small style='color:#6B7280'>{v.rango_texto}</small>", unsafe_allow_html=True)
        cols[4].markdown(_estado_badge_html(estado), unsafe_allow_html=True)

        if st.session_state.get(f"expand_home_{v.key}"):
            with st.container():
                _render_vencimiento_form(v)

    st.markdown("---")
    st.caption(
        "⚠️ Fechas marcadas con ⚠️ son aproximadas, calculadas según el NIT del cliente. "
        "Las fechas exactas de Retención en la Fuente y PILA dependen del cronograma oficial vigente. "
        "Siempre verificar contra el calendario DIAN y el operador PILA."
    )


# ── Página: Calendario (vista mes) ────────────────────────────────────────────

def render_calendar_page():
    st.markdown("## Calendario tributario")

    col_nav1, col_nav2, col_nav3, _ = st.columns([1, 2, 1, 4])
    with col_nav1:
        if st.button("◀ Mes anterior", key="cal_prev"):
            m = st.session_state["cal_month"] - 1
            y = st.session_state["cal_year"]
            if m < 1:
                m = 12
                y -= 1
            st.session_state["cal_month"] = m
            st.session_state["cal_year"] = y
            st.rerun()
    with col_nav2:
        mes_str = MESES_NOMBRE[st.session_state["cal_month"] - 1]
        st.markdown(
            f"<h3 style='text-align:center;margin:0;color:#1B2A4A'>"
            f"{mes_str} {st.session_state['cal_year']}</h3>",
            unsafe_allow_html=True,
        )
    with col_nav3:
        if st.button("Mes siguiente ▶", key="cal_next"):
            m = st.session_state["cal_month"] + 1
            y = st.session_state["cal_year"]
            if m > 12:
                m = 1
                y += 1
            st.session_state["cal_month"] = m
            st.session_state["cal_year"] = y
            st.rerun()

    st.markdown("<br/>", unsafe_allow_html=True)

    # Filtros
    cf1, cf2, cf3 = st.columns([2, 2, 2])
    with cf1:
        cliente_opts = ["Todos"] + [c.nombre for c in CLIENTS]
        filtro_c = st.selectbox("Filtrar por cliente", cliente_opts, key="cal_f_cliente")
    with cf2:
        oblig_opts_map = {
            "Todas": "Todas",
            "renta_pj": "Renta",
            "iva_bimestral": "IVA Bimestral",
            "retencion": "Retención en la Fuente",
            "pila": "PILA",
        }
        filtro_o = st.selectbox(
            "Filtrar por obligación",
            list(oblig_opts_map.keys()),
            format_func=lambda x: oblig_opts_map[x],
            key="cal_f_oblig",
        )
    with cf3:
        estado_opts = ["Todos", "pendiente", "proximo", "presentado", "vencido"]
        filtro_e = st.selectbox("Filtrar por estado", estado_opts, key="cal_f_estado")

    # Obtener vencimientos del mes
    year = st.session_state["cal_year"]
    month = st.session_state["cal_month"]

    todos = get_vencimientos_todos()
    day_map: dict = {}
    for v in todos:
        if filtro_c != "Todos" and v.client_nombre != filtro_c:
            continue
        if filtro_o != "Todas" and v.obligacion_id != filtro_o:
            continue
        estado = _get_estado(v)
        if filtro_e != "Todos" and estado != filtro_e:
            continue
        if v.fecha_exacta and v.fecha_exacta.year == year and v.fecha_exacta.month == month:
            d = v.fecha_exacta.day
            day_map.setdefault(d, []).append((v, estado))

    # Construir HTML del calendario
    dias_es = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    today = date.today()
    semanas = cal_lib.monthcalendar(year, month)

    html = '<table class="cal-grid"><thead><tr>'
    for d in dias_es:
        html += f"<th>{d}</th>"
    html += "</tr></thead><tbody>"

    for semana in semanas:
        html += "<tr>"
        for day in semana:
            if day == 0:
                html += '<td class="cal-empty"></td>'
            else:
                is_today = (date(year, month, day) == today)
                day_class = "cal-today" if is_today else ""
                num_class = "cal-daynum-today" if is_today else "cal-daynum"
                html += f'<td class="{day_class}"><div class="{num_class}">{day}</div>'
                for v, estado in day_map.get(day, []):
                    pill_class = f"cal-pill pill-{v.obligacion_id} pill-{estado}"
                    title = f"{v.client_nombre} — {v.obligacion_nombre}"
                    short = v.client_nombre[:9] + ("…" if len(v.client_nombre) > 9 else "")
                    html += f'<div class="{pill_class}" title="{title}">{short}</div>'
                html += "</td>"
        html += "</tr>"
    html += "</tbody></table>"

    st.markdown(html, unsafe_allow_html=True)

    # Leyenda
    st.markdown("<br/>", unsafe_allow_html=True)
    leyenda_cols = st.columns(5)
    leyendas = [
        ("pill-renta_pj", "Renta"),
        ("pill-iva_bimestral", "IVA"),
        ("pill-retencion", "Ret. Fuente"),
        ("pill-pila", "PILA"),
        ("pill-vencido", "Vencido"),
    ]
    for col, (cls, label) in zip(leyenda_cols, leyendas):
        col.markdown(
            f'<span class="cal-pill {cls}" style="display:inline-block">{label}</span>',
            unsafe_allow_html=True,
        )

    # Lista del mes (expandible)
    with st.expander(f"Ver lista de vencimientos de {MESES_NOMBRE[month-1]} {year}"):
        items_mes = [
            (v, e) for day_items in day_map.values() for (v, e) in day_items
        ]
        items_mes.sort(key=lambda x: x[0].fecha_exacta)
        for v, estado in items_mes:
            c1, c2, c3, c4 = st.columns([2.5, 3, 2, 1.5])
            c1.write(v.client_nombre)
            c2.write(f"{v.obligacion_nombre} — {v.periodo}")
            c3.write(v.fecha_exacta.strftime("%d/%m/%Y") if v.fecha_exacta else "—")
            c4.markdown(_estado_badge_html(estado), unsafe_allow_html=True)

    st.caption(
        "⚠️ Fechas de Retención y PILA son aproximadas según el NIT. "
        "Verificar el cronograma oficial DIAN y el operador PILA."
    )


# ── Formulario de tracking de un vencimiento ─────────────────────────────────

def _render_vencimiento_form(v: VencimientoItem):
    info = _get_info(v.key)
    with st.form(key=f"form_{v.key}", clear_on_submit=False):
        col1, col2 = st.columns([1, 2])
        with col1:
            opciones_estado = ["auto", "pendiente", "proximo", "presentado", "vencido"]
            estado_actual = info.get("estado", "auto")
            idx = opciones_estado.index(estado_actual) if estado_actual in opciones_estado else 0
            nuevo_estado = st.selectbox(
                "Estado",
                opciones_estado,
                index=idx,
                format_func=lambda x: "Auto" if x == "auto" else x.capitalize(),
                key=f"sel_estado_{v.key}",
            )
            fecha_pres = st.text_input(
                "Fecha de presentación (dd/mm/aaaa)",
                value=info.get("fecha_presentacion", ""),
                key=f"fec_pres_{v.key}",
            )
        with col2:
            nota = st.text_area(
                "Nota (para uso interno)",
                value=info.get("nota", ""),
                height=80,
                key=f"nota_{v.key}",
            )
        submitted = st.form_submit_button("Guardar")
        if submitted:
            _set_info(v.key, nuevo_estado, fecha_pres, nota)
            st.success("Guardado.")
            st.rerun()


# ── Página: Detalle de cliente ────────────────────────────────────────────────

def render_client_detail(client):
    ultimo, dos = get_nit_digitos(client.nit)

    st.markdown(f"""
<div class='client-header'>
    <span style='font-size:0.68rem;letter-spacing:0.15em;color:#C9A84C;text-transform:uppercase;'>
        Cliente activo
    </span><br/>
    <strong style='font-size:1.25rem;'>{client.nombre}</strong>
    &nbsp;&nbsp;
    <span style='color:#CBD5E1;font-size:0.88rem;'>NIT {client.nit}</span><br/>
    <span style='font-size:0.78rem;color:#94A3B8;'>
        Sector: {client.sector} &nbsp;|&nbsp;
        Contacto: {client.contacto} &nbsp;|&nbsp;
        {client.email} &nbsp;|&nbsp; {client.telefono}
    </span>
</div>
""", unsafe_allow_html=True)

    st.caption(
        f"📌 Último dígito NIT: **{ultimo}** · Dos últimos: **{dos}** "
        "— Fechas calculadas con base en el patrón habitual DIAN. "
        "Verificar siempre contra el calendario oficial vigente."
    )

    # Botón de descarga CSV
    csv_data = generate_csv_cliente(client)
    col_dl, _ = st.columns([2, 6])
    with col_dl:
        st.download_button(
            label="⬇️ Descargar calendario (CSV)",
            data=csv_data,
            file_name=f"calendario_{client.id}_{date.today().isoformat()}.csv",
            mime="text/csv",
        )

    st.markdown("---")

    vencimientos = get_vencimientos_cliente(client)

    # Agrupar por obligación
    grupos: dict = {}
    for v in vencimientos:
        grupos.setdefault(v.obligacion_id, []).append(v)

    for oblig_id, items in grupos.items():
        oblig = OBLIGACIONES_MAP.get(oblig_id)
        oblig_nombre = oblig.nombre if oblig else oblig_id
        oblig_periodo = oblig.periodicidad if oblig else ""

        with st.expander(f"**{oblig_nombre}** — {oblig_periodo}", expanded=True):
            for v in items:
                estado = _get_estado(v)
                fecha_display = (
                    v.fecha_exacta.strftime("%d/%m/%Y") if v.fecha_exacta
                    else (v.mes_aproximado or "Por confirmar")
                )
                aprox_tag = " ⚠️ aprox." if v.es_aproximada else ""
                card_class = f"cal-card {estado if estado in ('proximo','vencido','presentado') else 'pending'}"

                st.markdown(f"""
<div class="{card_class}">
    <div class="label">{v.obligacion_nombre} &nbsp; {_estado_badge_html(estado)}</div>
    <div class="date-exact">📅 {fecha_display}{aprox_tag}</div>
    <div class="date-range">{v.rango_texto}</div>
</div>
""", unsafe_allow_html=True)

                info = _get_info(v.key)
                nota_saved = info.get("nota", "")
                fecha_saved = info.get("fecha_presentacion", "")
                if nota_saved or fecha_saved:
                    st.markdown(
                        f"<small>📝 <em>{nota_saved}</em>"
                        f"{'  · ' + fecha_saved if fecha_saved else ''}</small>",
                        unsafe_allow_html=True,
                    )

                with st.expander(f"✏️ Editar estado / notas — {v.obligacion_nombre}", expanded=False):
                    _render_vencimiento_form(v)

    st.markdown("---")
    if client.notas:
        st.markdown(f"**Notas del cliente:** {client.notas}")

    st.caption(
        "Las fechas de Retención en la Fuente y PILA son aproximadas. "
        "Renta e IVA con rango confirmado se calculan según el patrón habitual DIAN para PJ. "
        "Verificar siempre el calendario oficial vigente."
    )


# ── Página: Calculadoras ──────────────────────────────────────────────────────

def render_calculadoras():
    st.markdown("## Calculadoras tributarias")

    uvt = 52374  # UVT 2026 — Resolución DIAN 000238 de 2025

    tab1, tab2, tab3 = st.tabs(["Retención a título de Renta", "Retención de IVA", "Retención de ICA"])

    # ── Tab 1: Renta ───────────────────────────────────────────────────────────
    with tab1:
        st.markdown("### Retención en la Fuente — Renta")
        conceptos = [t["concepto"] for t in TARIFAS_RENTA]
        concepto_sel = st.selectbox("Concepto", conceptos, key="calc_renta_concepto")
        tarifa_info = next(t for t in TARIFAS_RENTA if t["concepto"] == concepto_sel)

        base_uvt_min = tarifa_info["base_uvt"]
        tarifa_pct = tarifa_info["tarifa_pct"]
        base_min_cop = base_uvt_min * uvt

        st.markdown(
            f"Base mínima: **{base_uvt_min} UVT** = **{_fmt_cop(base_min_cop)}**  |  "
            f"Tarifa: **{tarifa_pct}%**"
        )

        base_input = st.number_input(
            "Base gravable (COP $)",
            min_value=0,
            value=0,
            step=100000,
            format="%d",
            key="calc_renta_base",
        )

        if base_input > 0:
            if base_input < base_min_cop and base_uvt_min > 0:
                st.markdown(
                    f'<div class="calc-no-aplica">Base <strong>{_fmt_cop(base_input)}</strong> es inferior al mínimo '
                    f'de {base_uvt_min} UVT ({_fmt_cop(base_min_cop)}). <strong>No aplica retención.</strong></div>',
                    unsafe_allow_html=True,
                )
            else:
                retencion = base_input * (tarifa_pct / 100)
                neto = base_input - retencion
                st.markdown(f"""
<div class="calc-result">
    <div class="cr-label">Valor retención ({tarifa_pct}%)</div>
    <div class="cr-value">{_fmt_cop(retencion)}</div>
    <div class="cr-label" style="margin-top:8px;">Base gravable</div>
    <div>{_fmt_cop(base_input)}</div>
    <div class="cr-label" style="margin-top:4px;">Valor neto a pagar al proveedor</div>
    <div>{_fmt_cop(neto)}</div>
</div>
""", unsafe_allow_html=True)
                if st.button("📋 Copiar resultado (Renta)", key="copy_renta"):
                    resultado_texto = (
                        f"Concepto: {concepto_sel}\n"
                        f"Base gravable: {_fmt_cop(base_input)}\n"
                        f"Tarifa retención: {tarifa_pct}%\n"
                        f"Valor retención: {_fmt_cop(retencion)}\n"
                        f"Valor neto: {_fmt_cop(neto)}\n"
                        f"(Tarifas 2026 — Fuente: ET Arts. 392-401, UVT $52.374)"
                    )
                    st.code(resultado_texto)
                    st.caption("Selecciona y copia el texto de arriba.")

    # ── Tab 2: IVA ─────────────────────────────────────────────────────────────
    with tab2:
        st.markdown("### Retención de IVA")
        st.info(
            "La retención de IVA se practica sobre el **valor del IVA facturado** "
            f"(no sobre la base del bien/servicio). Tarifa general: **15% del IVA**. "
            f"IVA 2026: **{IVA_TASA_GENERAL}%** (ET Art. 468)."
        )

        concepto_iva = st.selectbox(
            "Concepto",
            [t["concepto"] for t in TARIFAS_IVA],
            key="calc_iva_concepto",
        )
        tarifa_iva_info = next(t for t in TARIFAS_IVA if t["concepto"] == concepto_iva)
        pct_ret_iva = tarifa_iva_info["porcentaje_iva_retenido"]

        modo_iva = st.radio(
            "Ingresar",
            ["Base del bien/servicio (sin IVA)", "Valor del IVA ya calculado"],
            horizontal=True,
            key="calc_iva_modo",
        )

        base_iva_input = st.number_input(
            "Monto (COP $)",
            min_value=0,
            value=0,
            step=100000,
            format="%d",
            key="calc_iva_base",
        )

        if base_iva_input > 0:
            if modo_iva == "Base del bien/servicio (sin IVA)":
                iva_calculado = base_iva_input * (IVA_TASA_GENERAL / 100)
            else:
                iva_calculado = base_iva_input

            retencion_iva = iva_calculado * (pct_ret_iva / 100)
            st.markdown(f"""
<div class="calc-result">
    <div class="cr-label">IVA ({IVA_TASA_GENERAL}%)</div>
    <div>{_fmt_cop(iva_calculado)}</div>
    <div class="cr-label" style="margin-top:8px;">Retención IVA ({pct_ret_iva}% del IVA)</div>
    <div class="cr-value">{_fmt_cop(retencion_iva)}</div>
    <div class="cr-label" style="margin-top:4px;">IVA neto a pagar al proveedor</div>
    <div>{_fmt_cop(iva_calculado - retencion_iva)}</div>
</div>
""", unsafe_allow_html=True)

    # ── Tab 3: ICA ─────────────────────────────────────────────────────────────
    with tab3:
        st.markdown("### Retención de ICA")
        st.info(
            "La retención de ICA (ReteICA) varía por **municipio y actividad económica (CIIU)**. "
            "Las tarifas de referencia son para **Bogotá D.C.** (Acuerdo Distrital vigente). Las tarifas varían por municipio y código CIIU."
        )

        col_ica1, col_ica2 = st.columns([3, 2])
        with col_ica1:
            act_ica = st.selectbox(
                "Actividad (referencia Bogotá)",
                [t["actividad"] for t in TARIFAS_ICA_BOGOTA],
                key="calc_ica_actividad",
            )
        with col_ica2:
            tarifa_ica_default = next(
                t["tarifa_xmil"] for t in TARIFAS_ICA_BOGOTA if t["actividad"] == act_ica
            )
            tarifa_ica_input = st.number_input(
                "Tarifa (‰ por mil)",
                min_value=0.0,
                max_value=20.0,
                value=tarifa_ica_default,
                step=0.1,
                format="%.2f",
                key="calc_ica_tarifa",
            )

        base_ica_input = st.number_input(
            "Base gravable (ingresos brutos del período, COP $)",
            min_value=0,
            value=0,
            step=100000,
            format="%d",
            key="calc_ica_base",
        )

        if base_ica_input > 0:
            retencion_ica = base_ica_input * (tarifa_ica_input / 1000)
            st.markdown(f"""
<div class="calc-result">
    <div class="cr-label">Tarifa aplicada: {tarifa_ica_input:.2f}‰</div>
    <div class="cr-label" style="margin-top:6px;">Retención ICA</div>
    <div class="cr-value">{_fmt_cop(retencion_ica)}</div>
    <div class="cr-label" style="margin-top:4px;">Base gravable</div>
    <div>{_fmt_cop(base_ica_input)}</div>
</div>
""", unsafe_allow_html=True)


# ── Página: Indicadores ───────────────────────────────────────────────────────

def render_indicadores():
    st.markdown("## Indicadores y tabla de retención")

    # Indicadores
    uvt_info = INDICADORES_2026["uvt"]
    smmlv_info = INDICADORES_2026["smmlv"]
    aux_info = INDICADORES_2026["aux_transporte"]

    col1, col2, col3 = st.columns(3)
    for col, info in zip([col1, col2, col3], [uvt_info, smmlv_info, aux_info]):
        valor_str = _fmt_cop(info["valor"]) if info["valor"] else "Consultar"
        col.markdown(f"""
<div class="indicator-card">
    <div class="ic-label">{info['nombre']}</div>
    <div class="ic-value">{valor_str}</div>
    <span class="ic-nota">{info['nota']}</span>
</div>
""", unsafe_allow_html=True)

    # Valor de referencias en UVT
    uvt = uvt_info["valor"]
    smmlv = smmlv_info["valor"]

    col_a, col_b, col_c = st.columns(3)
    col_a.metric("4 UVT", _fmt_cop(4 * uvt), help="Cuantía mínima servicios generales")
    col_b.metric("27 UVT", _fmt_cop(27 * uvt), help="Cuantía mínima compras / arrendamiento inmuebles")
    col_c.metric("92 UVT", _fmt_cop(92 * uvt), help="Cuantía mínima bienes agrícolas sin procesamiento")

    st.markdown("---")

    # Tabla de retención en la fuente
    st.markdown("### Tabla de retención en la fuente")
    st.caption("Fuente: ET Arts. 383, 386, 392, 401; Decreto 1625/2016. UVT 2026 = $52.374 (Res. DIAN 000238/2025).")

    busqueda = st.text_input(
        "Buscar concepto",
        placeholder="Ej: honorarios, servicios, compras…",
        key="ind_busqueda_ret",
    ).lower()

    tabla_filtrada = [
        t for t in TARIFAS_RENTA
        if not busqueda or busqueda in t["concepto"].lower()
    ]

    if tabla_filtrada:
        html = """
<table class="ret-table">
<thead><tr>
    <th>#</th>
    <th>Concepto</th>
    <th>Base mínima (UVT)</th>
    <th>Base mínima (COP)</th>
    <th>Tarifa %</th>
</tr></thead><tbody>
"""
        for i, t in enumerate(tabla_filtrada, 1):
            base_cop = _fmt_cop(t["base_uvt"] * uvt) if t["base_uvt"] > 0 else "Sin mínimo"
            html += f"""
<tr>
    <td>{i}</td>
    <td>{t['concepto']}</td>
    <td style="text-align:center">{t['base_uvt'] if t['base_uvt'] > 0 else '—'}</td>
    <td style="text-align:right">{base_cop}</td>
    <td style="text-align:center;font-weight:700">{t['tarifa_pct']}%</td>
</tr>
"""
        html += "</tbody></table>"
        st.markdown(html, unsafe_allow_html=True)
    else:
        st.info("No se encontraron conceptos que coincidan con la búsqueda.")

    st.markdown("---")
    st.markdown("### Seguridad Social (PILA)")
    st.info(
        f"**Periodicidad:** {seguridad_social_2026.periodicidad}  \n"
        f"{seguridad_social_2026.regla}  \n\n"
        f"{seguridad_social_2026.nota}"
    )


# ── Página: Crear nuevo cliente ───────────────────────────────────────────────

def render_nuevo_cliente():
    import re as _re
    from data.clients import Client
    from data.obligaciones import OBLIGACIONES

    st.markdown("## Crear nuevo cliente")
    st.caption("Los clientes creados aquí están disponibles durante la sesión activa.")

    with st.form("form_nuevo_cliente", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            nombre   = st.text_input("Razón social *")
            nit      = st.text_input("NIT *", placeholder="901.234.567-3")
            contacto = st.text_input("Nombre del contacto")
            email    = st.text_input("Correo electrónico")
        with col2:
            telefono = st.text_input("Teléfono")
            sector   = st.text_input("Sector", placeholder="Comercio, Servicios, Tecnología…")
            notas    = st.text_area("Notas internas", height=104)

        oblig_map = {o.id: f"{o.nombre}  ({o.periodicidad})" for o in OBLIGACIONES}
        obligaciones_sel = st.multiselect(
            "Obligaciones tributarias",
            options=list(oblig_map.keys()),
            default=["renta_pj", "iva_bimestral", "retencion", "pila"],
            format_func=lambda x: oblig_map.get(x, x),
        )

        submitted = st.form_submit_button("Guardar cliente", use_container_width=True)

        if submitted:
            if not nombre.strip() or not nit.strip():
                st.error("Razón social y NIT son obligatorios.")
            else:
                nit_num = _re.sub(r"[^0-9]", "", nit.split("-")[0])
                ultimo  = nit_num[-1] if nit_num else "0"
                new_id  = f"c_new_{len(st.session_state.get('clientes_sesion', [])) + 1:03d}"
                nuevo   = Client(
                    id=new_id,
                    nombre=nombre.strip(),
                    nit=nit.strip(),
                    contacto=contacto.strip(),
                    email=email.strip(),
                    telefono=telefono.strip(),
                    sector=sector.strip(),
                    ultimo_digito_nit=ultimo,
                    obligaciones=obligaciones_sel or ["renta_pj", "retencion", "pila"],
                    notas=notas.strip(),
                )
                st.session_state.setdefault("clientes_sesion", []).append(nuevo)
                st.success(f"Cliente **{nombre}** creado. Aparece en la lista del sidebar.")
                st.rerun()


# ── Footer empresa ────────────────────────────────────────────────────────────

def render_footer():
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
<div style="
    border-top: 1px solid #C9A84C44;
    margin-top: 24px;
    padding: 18px 0 8px 0;
    text-align: center;
    color: #9CA3AF;
    font-size: 0.74rem;
    line-height: 1.8;
">
    <span style="color:#C9A84C; font-weight:700; font-size:0.85rem;">{COMPANY.razon_social}</span>
    &nbsp;|&nbsp; <span style="color:#CBD5E1;">{COMPANY.tipo}</span><br/>
    NIT&nbsp;<strong style="color:#C9A84C;">{COMPANY.nit}</strong>
    &nbsp;·&nbsp; {COMPANY.direccion}, {COMPANY.ciudad}
    &nbsp;·&nbsp; {COMPANY.telefono}
    &nbsp;·&nbsp; {COMPANY.email}
</div>
""", unsafe_allow_html=True)


# ── Portal router ─────────────────────────────────────────────────────────────

def render_portal():
    _init_session()
    render_sidebar()

    page = st.session_state.get("page", "inicio")

    if page == "inicio":
        render_home()
    elif page == "calendario":
        render_calendar_page()
    elif page == "calculadoras":
        render_calculadoras()
    elif page == "indicadores":
        render_indicadores()
    elif page == "nuevo_cliente":
        render_nuevo_cliente()
    elif page.startswith("cliente_"):
        client_id = page[len("cliente_"):]
        client = _get_clients_map().get(client_id)
        if client:
            render_client_detail(client)
        else:
            render_home()
    else:
        render_home()

    render_footer()


# ── Auth pages ────────────────────────────────────────────────────────────────

def render_auth():
    col = st.columns([1, 2, 1])[1]
    with col:
        st.markdown("""
<div style="display:flex;justify-content:center;padding:8px 0 12px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="140" height="140">
  <circle cx="140" cy="140" r="136" fill="#2a2826"/>
  <circle cx="140" cy="140" r="121" fill="none" stroke="#EDE8DC" stroke-width="5.5"/>
  <text x="100" y="200"
    font-family="'Playfair Display','Cormorant Garamond',Georgia,serif"
    font-size="175" font-style="italic" font-weight="400"
    fill="#EDE8DC" text-anchor="middle">9</text>
  <text x="186" y="193"
    font-family="'Playfair Display','Cormorant Garamond',Georgia,serif"
    font-size="152" font-style="italic" font-weight="400"
    fill="#EDE8DC" text-anchor="middle">A</text>
</svg>
</div>
""", unsafe_allow_html=True)

        st.markdown(
            "<h1 style='text-align:center;letter-spacing:0.08em;"
            "color:#1B2A4A;font-size:1.55rem;margin:8px 0 18px;'>"
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
                    "Username":  "Usuario",
                    "Password":  "Contraseña",
                    "Login":     "Entrar",
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
