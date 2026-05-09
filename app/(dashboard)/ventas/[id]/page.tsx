"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, Clock, CheckCircle, Truck, ShoppingBag, Ban,
  Banknote, CreditCard, Landmark, User, FileText, Package,
  ChevronDown, Loader2, AlertTriangle,
} from "lucide-react";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";
type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: string;
  variantSnapshot: Record<string, unknown> | null;
  product: { id: string; name: string };
}
interface Customer { id: string; name: string; phone: string | null; email: string | null }
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: string;
  shippingAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer: Customer | null;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "CANCELADO", label: "Cancelado" },
];
const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDIENTE: <Clock size={14} />,
  CONFIRMADO: <CheckCircle size={14} />,
  ENVIADO: <Truck size={14} />,
  ENTREGADO: <ShoppingBag size={14} />,
  CANCELADO: <Ban size={14} />,
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMADO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ENVIADO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ENTREGADO: "bg-brand-growth-neon/20 text-brand-growth-neon border-brand-growth-neon/30",
  CANCELADO: "bg-red-500/20 text-red-400 border-red-500/30",
};
const PM_ICONS: Record<PaymentMethod, React.ReactNode> = {
  EFECTIVO: <Banknote size={14} />,
  TARJETA: <CreditCard size={14} />,
  TRANSFERENCIA: <Landmark size={14} />,
};
const PM_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) { const d = await res.json(); setOrder(d); setNewStatus(d.status); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus() {
    if (!newStatus || !order || newStatus === order.status) return;
    if (newStatus === "CANCELADO" && !confirmCancel) { setConfirmCancel(true); return; }
    setSaving(true);
    setError("");
    setConfirmCancel(false);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev) => prev ? { ...prev, status: updated.status, updatedAt: updated.updatedAt } : prev);
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Error al actualizar");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-brand-muted">
        <Loader2 size={20} className="animate-spin mr-2" /> Cargando pedido...
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-white font-medium">Pedido no encontrado</p>
        <button onClick={() => router.push("/ventas")} className="text-brand-kinetic-orange text-sm hover:underline">
          Volver a Ventas
        </button>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  const shortId = order.id.slice(-8).toUpperCase();
  const statusChanged = newStatus !== order.status;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/ventas")}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Pedido #{shortId}</h1>
          <p className="text-xs text-brand-muted">{dateLabel(order.createdAt)}</p>
        </div>
        <button
          onClick={() => window.open(`/print/recibo/${order.id}`, "_blank")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-brand-muted hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* Status badge + update */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status]}`}>
              {STATUS_ICONS[order.status]}
              {STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={newStatus}
                onChange={(e) => { setNewStatus(e.target.value as OrderStatus); setConfirmCancel(false); }}
                disabled={order.status === "CANCELADO"}
                className="pl-3 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange transition-colors appearance-none cursor-pointer disabled:opacity-40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            </div>
            <button
              onClick={updateStatus}
              disabled={!statusChanged || saving || order.status === "CANCELADO"}
              className="px-4 py-2 rounded-xl bg-brand-kinetic-orange text-black text-sm font-bold disabled:opacity-30 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Actualizar
            </button>
          </div>
        </div>

        {confirmCancel && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs flex-1">Cancelar devolverá el stock. ¿Confirmar?</p>
            <button onClick={updateStatus} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
              Sí, cancelar
            </button>
            <button onClick={() => { setConfirmCancel(false); setNewStatus(order.status); }} className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs hover:bg-white/15 transition-colors">
              No
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User size={14} className="text-brand-muted" /> Cliente
          </h2>
          <div className="space-y-1">
            <p className="text-white text-sm font-medium">{order.customerName}</p>
            {order.customer?.phone && (
              <p className="text-brand-muted text-xs">{order.customer.phone}</p>
            )}
            {order.customer?.email && (
              <p className="text-brand-muted text-xs">{order.customer.email}</p>
            )}
            {!order.customer && (
              <p className="text-brand-muted text-xs italic">Cliente mostrador (sin cuenta)</p>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {PM_ICONS[order.paymentMethod]} Pago
          </h2>
          <div className="space-y-1">
            <p className="text-white text-sm font-medium">{PM_LABELS[order.paymentMethod]}</p>
            {order.shippingAddress && (
              <p className="text-brand-muted text-xs">{order.shippingAddress}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={14} className="text-brand-muted" /> Notas
          </h2>
          <p className="text-brand-muted text-sm whitespace-pre-line">{order.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Package size={14} className="text-brand-muted" /> Productos ({order.items.length})
          </h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {order.items.map((item) => {
            const variantLabel = item.variantSnapshot
              ? (item.variantSnapshot as { label?: string }).label
              : null;
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{item.product.name}</p>
                  {variantLabel && (
                    <p className="text-xs text-blue-400">{String(variantLabel)}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-white">{item.quantity} × Bs. {fmt(Number(item.unitPrice))}</p>
                  <p className="text-xs text-brand-kinetic-orange font-bold">
                    Bs. {fmt(item.quantity * Number(item.unitPrice))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Subtotal</span>
            <span>Bs. {fmt(subtotal)}</span>
          </div>
          {subtotal !== Number(order.total) && (
            <div className="flex justify-between text-sm text-brand-growth-neon">
              <span>Descuento/Puntos</span>
              <span>-Bs. {fmt(subtotal - Number(order.total))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
            <span>Total</span>
            <span className="text-brand-kinetic-orange text-lg">Bs. {fmt(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <p className="text-xs text-brand-muted/50 text-center pb-4">
        Creado: {dateLabel(order.createdAt)} · Actualizado: {dateLabel(order.updatedAt)}
      </p>
    </div>
  );
}
