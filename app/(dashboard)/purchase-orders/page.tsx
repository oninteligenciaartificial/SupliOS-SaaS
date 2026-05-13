"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Eye, Trash2, Send, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { formatMoney } from "@/lib/currency";

interface POItem {
  id: string;
  product: { name: string };
  quantity: number;
  unitCost: number;
  received: number;
}

interface PurchaseOrder {
  id: string;
  status: string;
  total: number;
  notes: string | null;
  expectedDate: string | null;
  createdAt: string;
  supplier: { name: string };
  items: POItem[];
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  cost: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  BORRADOR: { label: "Borrador", color: "bg-gray-500/20 text-gray-300", icon: Clock },
  ENVIADO: { label: "Enviado", color: "bg-blue-500/20 text-blue-300", icon: Send },
  PARCIAL: { label: "Parcial", color: "bg-yellow-500/20 text-yellow-300", icon: Truck },
  RECIBIDO: { label: "Recibido", color: "bg-green-500/20 text-green-300", icon: CheckCircle },
  CANCELADO: { label: "Cancelado", color: "bg-red-500/20 text-red-300", icon: XCircle },
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<PurchaseOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, [filterStatus]);

  async function fetchOrders() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/purchase-orders?${params}`);
    if (res.ok) {
      const json = await res.json();
      setOrders(json.data);
    }
    setLoading(false);
  }

  async function fetchSuppliers() {
    const res = await fetch("/api/suppliers");
    if (res.ok) {
      const json = await res.json();
      setSuppliers(json.data);
    }
  }

  async function fetchProducts() {
    const res = await fetch("/api/products?limit=200");
    if (res.ok) {
      const json = await res.json();
      setProducts(json.data);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Package size={32} className="text-brand-kinetic-orange" />
            Ordenes de Compra
          </h1>
          <p className="text-brand-muted mt-1">Gestiona pedidos a proveedores.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={16} /> Nueva Orden
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${!filterStatus ? "bg-brand-kinetic-orange text-black font-bold" : "border border-white/10 text-brand-muted hover:text-white"}`}
        >
          Todas
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1.5 ${filterStatus === key ? "bg-brand-kinetic-orange text-black font-bold" : "border border-white/10 text-brand-muted hover:text-white"}`}
          >
            <config.icon size={13} /> {config.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Package size={48} className="text-brand-muted mx-auto mb-4" />
          <p className="text-white font-bold mb-1">No hay ordenes de compra</p>
          <p className="text-brand-muted text-sm">Crea tu primera orden para empezar a gestionar proveedores.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-brand-muted">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Proveedor</th>
                <th className="text-left py-3 px-4 font-medium">Estado</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
                <th className="text-left py-3 px-4 font-medium">Fecha Esperada</th>
                <th className="text-left py-3 px-4 font-medium">Creada</th>
                <th className="text-right py-3 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const statusCfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.BORRADOR;
                return (
                  <tr key={po.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white/60 font-mono text-xs">{po.id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-white">{po.supplier.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-bold">{formatMoney(Number(po.total))}</td>
                    <td className="py-3 px-4 text-brand-muted text-xs">
                      {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("es-BO") : "—"}
                    </td>
                    <td className="py-3 px-4 text-brand-muted text-xs">
                      {new Date(po.createdAt).toLocaleDateString("es-BO")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setShowDetail(po)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchOrders(); }}
        />
      )}

      {/* Detail Modal */}
      {showDetail && (
        <DetailModal
          order={showDetail}
          onClose={() => setShowDetail(null)}
          onUpdate={() => { fetchOrders(); setShowDetail(null); }}
        />
      )}
    </div>
  );
}

function CreateModal({ suppliers, products, onClose, onSuccess }: { suppliers: Supplier[]; products: Product[]; onClose: () => void; onSuccess: () => void }) {
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([{ productId: "", quantity: 1, unitCost: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) { setError("Selecciona un proveedor"); return; }
    if (items.some((i) => !i.productId || i.quantity < 1)) { setError("Completa todos los productos"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, expectedDate: expectedDate || undefined, notes: notes || undefined, items }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const json = await res.json();
      setError(json.error || "Error al crear la orden");
    }
    setLoading(false);
  }

  function addItem() {
    setItems([...items, { productId: "", quantity: 1, unitCost: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4">
        <h2 className="text-xl font-display font-bold text-white">Nueva Orden de Compra</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Proveedor</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange"
            >
              <option value="">Seleccionar...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Fecha esperada (opcional)</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-brand-muted font-medium">Productos</label>
              <button type="button" onClick={addItem} className="text-xs text-brand-kinetic-orange hover:underline">
                + Agregar producto
              </button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(idx, "productId", e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange"
                >
                  <option value="">Producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange"
                  placeholder="Cant."
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                  className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange"
                  placeholder="Costo"
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-300">
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right text-white font-bold">
            Total: {formatMoney(total)}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-brand-muted hover:text-white text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailModal({ order, onClose, onUpdate }: { order: PurchaseOrder; onClose: () => void; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.BORRADOR;

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    const res = await fetch(`/api/purchase-orders?id=${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) onUpdate();
    setUpdating(false);
  }

  async function deleteOrder() {
    if (!confirm("¿Eliminar esta orden?")) return;
    setUpdating(true);
    const res = await fetch(`/api/purchase-orders?id=${order.id}`, { method: "DELETE" });
    if (res.ok) onUpdate();
    setUpdating(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Orden {order.id.slice(-8).toUpperCase()}</h2>
            <p className="text-brand-muted text-sm">{order.supplier.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-brand-muted">Total:</span>
            <span className="text-white font-bold ml-2">{formatMoney(Number(order.total))}</span>
          </div>
          <div>
            <span className="text-brand-muted">Fecha esperada:</span>
            <span className="text-white ml-2">{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString("es-BO") : "—"}</span>
          </div>
          <div>
            <span className="text-brand-muted">Creada:</span>
            <span className="text-white ml-2">{new Date(order.createdAt).toLocaleDateString("es-BO")}</span>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <span className="text-brand-muted">Notas:</span>
              <p className="text-white text-sm mt-1">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-bold text-sm">Productos</h3>
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-white/10 text-brand-muted">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Producto</th>
                  <th className="text-right py-2 px-3 font-medium">Cantidad</th>
                  <th className="text-right py-2 px-3 font-medium">Costo Unit.</th>
                  <th className="text-right py-2 px-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-2 px-3 text-white">{item.product.name}</td>
                    <td className="py-2 px-3 text-right text-white">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-white">{formatMoney(Number(item.unitCost))}</td>
                    <td className="py-2 px-3 text-right text-white font-bold">{formatMoney(item.quantity * Number(item.unitCost))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {order.status !== "RECIBIDO" && order.status !== "CANCELADO" && (
          <div className="flex gap-2 flex-wrap">
            {order.status === "BORRADOR" && (
              <button onClick={() => updateStatus("ENVIADO")} disabled={updating} className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/30 disabled:opacity-50">
                Marcar Enviado
              </button>
            )}
            {(order.status === "ENVIADO" || order.status === "PARCIAL") && (
              <button onClick={() => updateStatus("RECIBIDO")} disabled={updating} className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium hover:bg-green-500/30 disabled:opacity-50">
                Marcar Recibido (actualiza stock)
              </button>
            )}
            <button onClick={deleteOrder} disabled={updating} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 disabled:opacity-50">
              Eliminar
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-brand-muted hover:text-white text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
