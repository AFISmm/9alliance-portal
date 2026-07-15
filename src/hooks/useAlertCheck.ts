import { useEffect } from 'react';
import { clients, clientsMap } from '../data/clients';
import { obligaciones, obligacionesMap } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import { getAlertConfig, loadNotifiedIds, markNotified } from '../data/alertConfig';
import { useNotifications } from '../context/NotificationContext';

/**
 * Se ejecuta una vez al montar AppShell. Revisa todos los vencimientos
 * de todas las empresas y genera notificaciones internas de campana
 * para las obligaciones próximas o vencidas, respetando la configuración
 * de anticipación por empresa y la deduplicación (no repite notificaciones).
 */
export function useAlertCheck() {
  const { addNotification, notifications } = useNotifications();

  useEffect(() => {
    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    const allVenc  = getAllVencimientos(clients, obligaciones);
    const notified = loadNotifiedIds();

    // IDs ya en el panel de notificaciones (evita duplicar si aún no se ha limpiado)
    const existingHrefs = new Set(notifications.map(n => n.href));

    allVenc.forEach(v => {
      if (v.estado === 'presentado') return;
      if (notified.has(v.id))       return;

      const cfg = getAlertConfig(v.clienteId);
      if (!cfg.habilitado) return;

      // Fecha exacta del vencimiento (ISO)
      const fechaStr = v.fechaExactaNit ?? v.fechaFin;
      if (!fechaStr) return;

      const fechaVenc = new Date(fechaStr);
      fechaVenc.setHours(0, 0, 0, 0);
      const diffDias = Math.ceil((fechaVenc.getTime() - today.getTime()) / 86_400_000);

      const esVencido   = diffDias < 0;
      const esProximo   = cfg.anticipacionDias.some(d => diffDias >= 0 && diffDias <= d);

      if (!esVencido && !esProximo) return;

      const cliente = clientsMap[v.clienteId];
      const oblig   = obligacionesMap[v.obligacionId];
      const href    = `/empresa/${v.clienteId}`;

      // No duplicar si ya hay una notificación para esta empresa/obligación
      if (existingHrefs.has(href)) return;

      addNotification({
        type:  esVencido ? 'alert' : 'info',
        title: esVencido
          ? `Obligación vencida: ${oblig?.nombre ?? v.obligacionId}`
          : `Próxima a vencer (${diffDias}d): ${oblig?.nombre ?? v.obligacionId}`,
        body:  `${cliente?.nombre ?? v.clienteId} · ${v.fechaExactaLabel ?? v.rangoFechas}`,
        href,
      });

      markNotified(v.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar
}
