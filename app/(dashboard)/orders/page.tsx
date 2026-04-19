"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, X, Search, ChevronDown, Printer, Eye } from "lucide-react";

type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

interface Product { id: string; name: string; price: string; stock: number }
interface Customer { id: string; name: string }
interface OrderItem { productId: string; quantity: number; unitPrice: number; product: { name: string } }
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  customer: Customer | null;
}

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

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "", customerId: "", notes: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0 }],
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const url = filterStatus ? `/api/orders?status=${filterStatus}` : "/api/orders";
    const res = await fetch(url);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function openCreate() {
    setForm({ customerName: "", customerId: "", notes: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });
    setError("");
    setShowModal(true);
    setLoadingModal(true);
    const [p, c] = await Promise.all([fetch("/api/products"), fetch("/api/customers")]);
    if (p.ok) setProducts(await p.json());
    if (c.ok) setCustomers(await c.json());
    setLoadingModal(false);
  }

  function addItem() { setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: 1, unitPrice: 0 }] })); }
  function removeItem(i: number) { setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }
  function setItem(i: number, field: string, value: string | number) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) => {
        if (idx !== i) return item;
        if (field === "productId") {
          const prod = products.find((p) => p.id === value);
          return { ...item, productId: String(value), unitPrice: prod ? Number(prod.price) : item.unitPrice };
        }
        return { ...item, [field]: value };
      }),
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.items.some((i) => !i.productId)) { setError("Selecciona un producto en cada linea"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        customerId: form.customerId || undefined,
        notes: form.notes || undefined,
        items: form.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      }),
    });
    if (res.ok) { setShowModal(false); fetchOrders(); }
    else { const d = await res.json(); setError(d.error ?? "Error al crear pedido"); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
    setActionsId(null);
    if (detailOrder?.id === id) setDetailOrder((prev) => prev ? { ...prev, status } : null);
  }

  function printTicket(order: Order) {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    const lines = order.items.map((i) =>
      `<tr><td>${i.product.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">$${fmt(i.quantity * Number(i.unitPrice))}</td></tr>`
    ).join("");
    win.document.write(`
      <html><head><title>Ticket</title>
      <style>body{font-family:monospace;font-size:13px;margin:20px}h2{text-align:center;margin-bottom:4px}p{text-align:center;color:#666;margin:2px 0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:4px 6px}th{border-bottom:1px solid #ccc;text-align:left}tfoot td{border-top:2px solid #333;font-weight:bold}.footer{text-align:center;margin-top:16px;color:#999;font-size:11px}</style>
      </head><body>
      <h2>Ticket de Venta</h2>
      <p>${new Date(order.createdAt).toLocaleString("es-MX")}</p>
      <p>Cliente: <strong>${order.customerName}</strong></p>
      <table><thead><tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${lines}</tbody>
      <tfoot><tr><td colspan="2">TOTAL</td><td style="text-align:right">$${fmt(Number(order.total))}</td></tr></tfoot>
      </table>
      ${order.notes ? `<p style="margin-top:12px;font-style:italic">${order.notes}</p>` : ""}
      <div class="footer">Gracias por su compra</div>
      </body></html>`);
    win.document.close();
    win.print();
  }

  const filtered = orders.filter((o) =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );
  const orderTotal = form.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Pedidos</h1>
          <p className="text-brand-muted mt-1 text-sm">Gestiona las ordenes de tus clientes.</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 md:px-6 py-2.5 md:py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] text-sm md:text-base">
          <Plus size={16} /> Nuevo
        </button>
      </header>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente o ID..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm">
          <option value="">Todos</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Cargando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-brand-muted space-y-3">
          <ShoppingCart size={40} className="mx-auto opacity-30" />
          <p>No hay pedidos.</p>
        </div>
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="glass-panel rounded-2xl overflow-hidden animate-pop hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-brand-muted font-medium text-sm">Cliente</th>
                  <th className="p-4 text-brand-muted font-medium text-sm">Items</th>
                  <th className="p-4 text-brand-muted font-medium text-sm">Total</th>
                  <th className="p-4 text-brand-muted font-medium text-sm">Estado</th>
                  <th className="p-4 text-brand-muted font-medium text-sm">Fecha</th>
                  <th className="p-4 text-brand-muted font-medium text-sm">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setDetailOrder(o)}>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{o.customerName}</div>
                      <div className="text-xs text-brand-muted font-mono">{o.id.slice(0, 8)}…</div>
                    </td>
                    <td className="p-4 text-brand-muted text-sm">{o.items.length}</td>
                    <td className="p-4 font-bold text-white text-sm">${fmt(Number(o.total))}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td className="p-4 text-brand-muted text-xs">{new Date(o.createdAt).toLocaleDateString("es-MX")}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setActionsId(actionsId === o.id ? null : o.id)} className="flex items-center gap-1 text-brand-muted hover:text-white transition-colors text-xs py-1 px-2 rounded-lg hover:bg-white/5">
                          <ChevronDown size={14} />
                        </button>
                        {actionsId === o.id && (
                          <div className="absolute right-0 mt-1 glass-panel rounded-xl p-2 z-20 space-y-1 min-w-[160px] shadow-xl">
                            {(Object.keys(STATUS_LABELS) as OrderStatus[]).filter((s) => s !== o.status).map((s) => (
                              <button key={s} onClick={() => updateStatus(o.id, s)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-brand-muted hover:text-white transition-colors">Marcar: {STATUS_LABELS[s]}</button>
                            ))}
                            <div className="border-t border-white/10 my-1" />
                            <button onClick={() => { setDetailOrder(o); setActionsId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-brand-muted hover:text-white transition-colors flex items-center gap-2"><Eye size={12} /> Ver detalle</button>
                            <button onClick={() => { printTicket(o); setActionsId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-brand-muted hover:text-white transition-colors flex items-center gap-2"><Printer size={12} /> Imprimir ticket</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <div className="md:hidden space-y-3 animate-pop">
            {filtered.map((o) => (
              <div key={o.id} className="glass-panel rounded-2xl p-4 space-y-3 active:scale-[0.99] transition-transform cursor-pointer" onClick={() => setDetailOrder(o)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{o.customerName}</div>
                    <div className="text-xs text-brand-muted">{new Date(o.createdAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span className="text-brand-muted">{o.items.length} items</span>
                    <span className="font-bold text-brand-kinetic-orange">${fmt(Number(o.total))}</span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { printTicket(o); }} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-white transition-colors"><Printer size={14} /></button>
                    <div className="relative">
                      <button onClick={() => setActionsId(actionsId === o.id ? null : o.id)} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-white transition-colors"><ChevronDown size={14} /></button>
                      {actionsId === o.id && (
                        <div className="absolute right-0 bottom-10 glass-panel rounded-xl p-2 z-20 space-y-1 min-w-[160px] shadow-xl">
                          {(Object.keys(STATUS_LABELS) as OrderStatus[]).filter((s) => s !== o.status).map((s) => (
                            <button key={s} onClick={() => updateStatus(o.id, s)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-brand-muted hover:text-white transition-colors">Marcar: {STATUS_LABELS[s]}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order detail modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetailOrder(null)}>
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-display font-bold text-white">{detailOrder.customerName}</h2>
                <p className="text-xs text-brand-muted font-mono mt-0.5">{detailOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printTicket(detailOrder)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors" title="Imprimir ticket">
                  <Printer size={16} />
                </button>
                <button onClick={() => setDetailOrder(null)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[detailOrder.status]}`}>{STATUS_LABELS[detailOrder.status]}</span>
              <span className="text-xs text-brand-muted">{new Date(detailOrder.createdAt).toLocaleString("es-MX")}</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-brand-muted uppercase tracking-wider">Productos</p>
              {detailOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <div className="text-sm font-medium text-white">{item.product.name}</div>
                    <div className="text-xs text-brand-muted">{item.quantity} × ${fmt(Number(item.unitPrice))}</div>
                  </div>
                  <div className="font-bold text-white text-sm">${fmt(item.quantity * Number(item.unitPrice))}</div>
                </div>
              ))}
            </div>

            {detailOrder.notes && (
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-brand-muted mb-1">Notas</p>
                <p className="text-sm text-white">{detailOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-brand-muted">Total</span>
              <span className="text-2xl font-display font-bold text-brand-kinetic-orange">${fmt(Number(detailOrder.total))}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <p className="text-xs text-brand-muted col-span-2">Cambiar estado:</p>
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).filter((s) => s !== detailOrder.status).map((s) => (
                <button key={s} onClick={() => updateStatus(detailOrder.id, s)} className="py-2 px-3 rounded-xl text-xs font-medium border border-white/10 hover:bg-white/5 text-brand-muted hover:text-white transition-colors">
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6 my-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Pedido</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre del cliente *</label>
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={inp} placeholder="Nombre o razon social" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Cliente registrado (opcional)</label>
                <select value={form.customerId} onChange={(e) => { const c = customers.find((x) => x.id === e.target.value); setForm({ ...form, customerId: e.target.value, customerName: c ? c.name : form.customerName }); }} className={inp}>
                  <option value="">-- Sin vincular --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-brand-muted">Productos *</label>
                  <button type="button" onClick={addItem} className="text-brand-kinetic-orange text-sm font-bold hover:underline">+ Agregar linea</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <select value={item.productId} onChange={(e) => setItem(i, "productId", e.target.value)} className={`${inp} flex-1`} disabled={loadingModal}>
                      <option value="">{loadingModal ? "Cargando..." : products.length === 0 ? "Sin productos" : "-- Producto --"}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toLocaleString("es-MX")})</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setItem(i, "quantity", Number(e.target.value))} className={`${inp} w-20`} placeholder="Cant." />
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setItem(i, "unitPrice", Number(e.target.value))} className={`${inp} w-28`} placeholder="Precio" />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-colors"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inp} resize-none`} rows={2} placeholder="Instrucciones especiales..." />
              </div>
              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <span className="text-brand-muted text-sm">Total</span>
                <span className="text-2xl font-display font-bold text-white">${fmt(orderTotal)}</span>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Creando..." : "Crear Pedido"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
