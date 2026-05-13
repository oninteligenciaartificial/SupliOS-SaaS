"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle, XCircle, AlertCircle, Clock, Filter } from "lucide-react";

type EmailLog = {
  id: string;
  organizationId: string | null;
  to: string;
  type: string;
  subject: string;
  status: "SENT" | "DELIVERED" | "BOUNCED" | "BLOCKED" | "SPAM" | "FAILED";
  brevoMessageId: string | null;
  error: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
};

const TYPE_LABELS: Record<string, string> = {
  order_confirmation: "Confirmación de pedido",
  order_status_update: "Actualización de estado",
  new_order_alert: "Alerta de nuevo pedido",
  welcome_email: "Bienvenida",
  birthday_email: "Cumpleaños",
  loyalty_points_email: "Puntos de lealtad",
  low_stock_alert: "Stock bajo",
  expiry_alert: "Productos por vencer",
  inactive_customer_email: "Cliente inactivo",
  plan_expiry_warning: "Plan por vencer",
  plan_activated: "Plan activado",
  plan_expired: "Plan vencido",
  plain_notification: "Notificación",
};

const STATUS_COLORS: Record<string, string> = {
  SENT: "bg-blue-500/15 text-blue-400",
  DELIVERED: "bg-green-500/15 text-green-400",
  BOUNCED: "bg-red-500/15 text-red-400",
  BLOCKED: "bg-yellow-500/15 text-yellow-400",
  SPAM: "bg-orange-500/15 text-orange-400",
  FAILED: "bg-red-500/15 text-red-400",
};

export default function EmailStatsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/superadmin/email-stats?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? {});
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, [typeFilter, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-3">
          <Mail size={28} className="text-brand-kinetic-orange" />
          Métricas de Email
        </h1>
        <p className="text-brand-muted mt-1 text-sm">Monitoreo de envíos via Brevo</p>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Total enviados</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.sent ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">En tránsito</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.delivered ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Entregados</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.bounced ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Rebotados</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.failed ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Fallidos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-brand-muted" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange"
        >
          <option value="">Todos los estados</option>
          <option value="SENT">En tránsito</option>
          <option value="DELIVERED">Entregado</option>
          <option value="BOUNCED">Rebotado</option>
          <option value="BLOCKED">Bloqueado</option>
          <option value="SPAM">Spam</option>
          <option value="FAILED">Fallido</option>
        </select>
        <button
          onClick={() => { setTypeFilter(""); setStatusFilter(""); }}
          className="px-3 py-2 rounded-lg bg-white/5 text-brand-muted text-sm hover:text-white transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Logs table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-brand-muted">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-brand-muted">No hay registros de email</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Destinatario</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-brand-muted text-xs">
                      {new Date(log.createdAt).toLocaleString("es-BO")}
                    </td>
                    <td className="py-3 px-4 text-white text-xs font-mono truncate max-w-[200px]">
                      {log.to}
                    </td>
                    <td className="py-3 px-4 text-white text-xs">
                      {TYPE_LABELS[log.type] ?? log.type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[log.status] ?? "bg-white/5 text-brand-muted"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-red-400 text-xs max-w-[200px] truncate">
                      {log.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
