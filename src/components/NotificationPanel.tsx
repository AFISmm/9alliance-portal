import { useNavigate } from 'react-router-dom';
import { X, Bell, MessageSquarePlus, Info, AlertTriangle, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useLayout } from '../context/LayoutContext';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification } from '../context/NotificationContext';

const DAY_NAMES   = ['dom','lun','mar','mié','jue','vie','sáb'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatTime(ts: number): string {
  const d   = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000)  return 'ahora mismo';
  if (diff < 3600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3600_000)} h`;
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function TypeIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'pqr')   return <MessageSquarePlus size={16} strokeWidth={1.8} style={{ color: '#C9A84C' }} />;
  if (type === 'alert') return <AlertTriangle      size={16} strokeWidth={1.8} style={{ color: '#f59e0b' }} />;
  return <Info size={16} strokeWidth={1.8} style={{ color: '#4A7FD4' }} />;
}

function typeBg(type: AppNotification['type']): string {
  if (type === 'pqr')   return 'rgba(201,168,76,.12)';
  if (type === 'alert') return 'rgba(245,158,11,.1)';
  return 'rgba(74,127,212,.1)';
}

export function NotificationPanel() {
  const navigate = useNavigate();
  const { notificationOpen, setNotificationOpen } = useLayout();
  const { notifications, unreadCount, markAllRead, removeNotification, markRead } = useNotifications();

  function handleView(n: AppNotification) {
    markRead(n.id);
    setNotificationOpen(false);
    navigate(n.href);
  }

  return (
    <>
      {/* Backdrop */}
      {notificationOpen && (
        <div
          onClick={() => setNotificationOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 55 }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 360,
        maxWidth: '100vw',
        zIndex: 60,
        background: 'linear-gradient(180deg, #111c2e 0%, #0d1829 100%)',
        borderLeft: '1px solid rgba(255,255,255,.08)',
        display: 'flex', flexDirection: 'column',
        transform: notificationOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: notificationOpen ? '-8px 0 32px rgba(0,0,0,.4)' : 'none',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={17} strokeWidth={1.8} style={{ color: '#C9A84C' }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#F4F7FB' }}>
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 99,
                background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)',
                fontSize: 10, fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif",
              }}>
                {unreadCount} nuevas
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Marcar todas como leídas"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  color: '#7C8A9C', cursor: 'pointer', fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <CheckCheck size={12} strokeWidth={2} />
                Leer todo
              </button>
            )}
            <button
              onClick={() => setNotificationOpen(false)}
              style={{
                width: 30, height: 30, borderRadius: 7,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#7C8A9C',
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} strokeWidth={1.5} style={{ color: '#566375' }} />
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#566375', textAlign: 'center' }}>
                Sin notificaciones
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{
                borderRadius: 10,
                background: n.read ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${n.read ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.1)'}`,
                padding: '12px 13px',
                display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'background .12s',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: typeBg(n.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <TypeIcon type={n.type} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, color: n.read ? '#AEBCCD' : '#F4F7FB', flex: 1, lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: '#7C8A9C', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.body}
                    </p>
                  </div>
                </div>

                {/* Time + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#566375' }}>
                    {formatTime(n.timestamp)}
                  </span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() => handleView(n)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 6,
                        background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)',
                        color: '#C9A84C', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <ExternalLink size={10} strokeWidth={2} />
                      VER
                    </button>
                    <button
                      onClick={() => removeNotification(n.id)}
                      title="Eliminar notificación"
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#ef4444',
                      }}
                    >
                      <Trash2 size={11} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
