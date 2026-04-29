"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = {
  order: "Pedidos",
  product: "Productos",
  customer: "Clientes",
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-brand-growth-neon",
  update: "text-blue-400",
  delete: "text-red-400",
  cancel: "text-yellow-400",
};

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? "text-brand-muted";
  return <span className={`text-xs font-bold uppercase ${color}`}>{action}</span>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [entityFilter, setEntityFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 50;

  const fetchLogs = useCallback(async (p: number, et: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (et) params.set("entityType", et);
    const res = await fetch(`/api/audit?${params}`);
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (res.ok) {
      const d = await res.json();
      setLogs(d.data);
      setTotal(d.meta.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(page, entityFilter); }, [page, entityFilter, fetchLogs]);

  function handleFilter(et: string) {
    setEntityFilter(et);
    setPage(1);
  }

  const pages = Math.ceil(total / limit);

  if (forbidden) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-16 text-center space-y-4">
        <Shield size={48} className="mx-auto text-brand-muted opacity-40" />
        <h1 className="text-2xl font-bold text-white">Plan Empresarial requerido</h1>
        <p className="text-brand-muted">El audit log detallado está disponible en el plan Empresarial.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Audit Log</h1>
          <p className="text-brand-muted mt-1">Historial de acciones en tu cuenta. {total > 0 && `${total} registros.`}</p>
        </div>
      </header>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-2 flex-wrap animate-pop">
        <Filter size={14} className="text-brand-muted" />
        <button onClick={() => handleFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!entityFilter ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>
          Todos
        </button>
        {Object.entries(ENTITY_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => handleFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${entityFilter === k ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando registros...</div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center text-brand-muted">
          <Shield size={36} className="mx-auto mb-3 opacity-20" />
          <p>Sin registros de auditoría aún.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-brand-muted text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Fecha</th>
                <th className="text-left px-5 py-3">Acción</th>
                <th className="text-left px-5 py-3">Entidad</th>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">Usuario</th>
                <th className="text-left px-5 py-3">IP</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr key={log.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                    <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-5 py-3 text-white">{ENTITY_LABELS[log.entityType] ?? log.entityType}</td>
                    <td className="px-5 py-3 text-brand-muted font-mono text-xs">{log.entityId.slice(-8)}</td>
                    <td className="px-5 py-3 text-brand-muted font-mono text-xs">{log.userId.slice(-8)}</td>
                    <td className="px-5 py-3 text-brand-muted text-xs">{log.ip ?? "—"}</td>
                    <td className="px-5 py-3 text-brand-muted text-xs">{(log.before || log.after) ? "▶" : ""}</td>
                  </tr>
                  {expanded === log.id && (log.before || log.after) && (
                    <tr key={`${log.id}-detail`} className="bg-white/[0.02]">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          {log.before && (
                            <div>
                              <p className="text-xs text-brand-muted mb-1 uppercase tracking-wider">Antes</p>
                              <pre className="text-xs text-white/70 bg-black/30 p-3 rounded-xl overflow-x-auto">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && (
                            <div>
                              <p className="text-xs text-brand-muted mb-1 uppercase tracking-wider">Después</p>
                              <pre className="text-xs text-white/70 bg-black/30 p-3 rounded-xl overflow-x-auto">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-brand-muted animate-pop">
          <span>Página {page} de {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
