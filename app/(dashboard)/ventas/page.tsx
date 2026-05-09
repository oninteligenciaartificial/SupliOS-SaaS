"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Search, Clock, CheckCircle, Truck,
  ShoppingBag, Ban, Banknote, CreditCard, Landmark, Eye,
  Printer, Filter, ChevronDown, Loader2,
} from "lucide-react";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";
type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

interface OrderItem { product: { name: string }; quantity: number; unitPrice: string }
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}
interface Meta { total: number; page: number; pages: number; limit: number }

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDIENTE: <Clock size={11} />,
  CONFIRMADO: <CheckCircle size={11} />,
  ENVIADO: <Truck size={11} />,
  ENTREGADO: <ShoppingBag size={11} />,
  CANCELADO: <Ban size={11} />,
};
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente", CONFIRMADO: "Confirmado", ENVIADO: "Enviado",
  ENTREGADO: "Entregado", CANCELADO: "Cancelado",
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400",
  CONFIRMADO: "bg-blue-500/20 text-blue-400",
  ENVIADO: "bg-purple-500/20 text-purple-400",
  ENTREGADO: "bg-brand-growth-neon/20 text-brand-growth-neon",
  CANCELADO: "bg-red-500/20 text-red-400",
};
const PM_ICONS: Record<PaymentMethod, React.ReactNode> = {
  EFECTIVO: <Banknote size={12} />,
  TARJETA: <CreditCard size={12} />,
  TRANSFERENCIA: <Landmark size={12} />,
};
const PM_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function shortId(id: string) { return id.slice(-8).toUpperCase(); }

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

export default function VentasPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pages: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const [filterPM, setFilterPM] = useState<PaymentMethod | "">("");
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) {
      const d = await res.json();
      setOrders(d.data ?? []);
      setMeta(d.meta ?? { total: 0, page: 1, pages: 1, limit: 50 });
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { setPage(1); load(1); }, [filterStatus, load]);

  const displayed = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.customerName.toLowerCase().includes(q) ||
      shortId(o.id).toLowerCase().includes(q);
    const matchPM = !filterPM || o.paymentMethod === filterPM;
    return matchSearch && matchPM;
  });

  const totalDisplay = displayed.reduce((s, o) => s + Number(o.total), 0);

  function changePage(p: number) {
    setPage(p);
    load(p);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart size={22} className="text-brand-kinetic-orange" />
            Ventas
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">Historial de ventas y pedidos</p>
        </div>
        <button
          onClick={() => router.push("/ventas/nueva")}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Nueva Venta
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o # pedido..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
          />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "")}
            className="pl-8 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterPM}
            onChange={(e) => setFilterPM(e.target.value as PaymentMethod | "")}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm appearance-none cursor-pointer pr-8"
          >
            <option value="">Todos los métodos</option>
            {(Object.keys(PM_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>{PM_LABELS[m]}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>
      </div>

      {/* Summary strip */}
      {!loading && displayed.length > 0 && (
        <div className="flex gap-4 text-sm text-brand-muted px-1">
          <span><span className="text-white font-medium">{meta.total}</span> ventas totales</span>
          <span>·</span>
          <span>Mostrando <span className="text-white font-medium">{displayed.length}</span></span>
          <span>·</span>
          <span>Total: <span className="text-brand-kinetic-orange font-bold">Bs. {fmt(totalDisplay)}</span></span>
        </div>
      )}

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand-muted">
            <Loader2 size={20} className="animate-spin mr-2" /> Cargando ventas...
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={36} className="mx-auto mb-3 text-brand-muted opacity-20" />
            <p className="text-brand-muted text-sm">Sin ventas registradas</p>
            <button
              onClick={() => router.push("/ventas/nueva")}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-sm font-medium hover:bg-brand-kinetic-orange/30 transition-colors"
            >
              Registrar primera venta
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted"># Pedido</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Método</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-muted">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand-muted">#{shortId(order.id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white">{order.customerName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-brand-muted">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                          {PM_ICONS[order.paymentMethod]}
                          {PM_LABELS[order.paymentMethod]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_ICONS[order.status]}
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-brand-kinetic-orange">Bs. {fmt(Number(order.total))}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-brand-muted">{dateLabel(order.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/ventas/${order.id}`)}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => window.open(`/print/recibo/${order.id}`, "_blank")}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
                            title="Imprimir recibo"
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {displayed.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-brand-muted">#{shortId(order.id)}</span>
                      <p className="text-sm font-medium text-white mt-0.5">{order.customerName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_ICONS[order.status]}
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                      {PM_ICONS[order.paymentMethod]} {PM_LABELS[order.paymentMethod]}
                      <span className="ml-1">· {order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                    </span>
                    <span className="text-sm font-bold text-brand-kinetic-orange">Bs. {fmt(Number(order.total))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-muted">{dateLabel(order.createdAt)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => router.push(`/ventas/${order.id}`)}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => window.open(`/print/recibo/${order.id}`, "_blank")}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-muted hover:text-white transition-colors"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <span className="text-xs text-brand-muted">
                  Página {meta.page} de {meta.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => changePage(page + 1)}
                    disabled={page >= meta.pages}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
