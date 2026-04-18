"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, X, Trash2, ToggleLeft, ToggleRight, Calendar } from "lucide-react";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  type: "PORCENTAJE" | "MONTO_FIJO";
  value: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const EMPTY = { code: "", description: "", type: "PORCENTAJE" as "PORCENTAJE" | "MONTO_FIJO", value: "", expiresAt: "" };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/discounts");
    if (res.ok) setDiscounts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: parseFloat(form.value),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm(EMPTY);
      fetchDiscounts();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al crear");
    }
    setSaving(false);
  }

  async function toggleActive(d: Discount) {
    await fetch(`/api/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    fetchDiscounts();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchDiscounts();
  }

  function isExpired(d: Discount) {
    if (!d.expiresAt) return false;
    return new Date(d.expiresAt) < new Date();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Descuentos</h1>
          <p className="text-brand-muted mt-1">Codigos promocionales y ofertas</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); setForm(EMPTY); }}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nuevo Descuento
        </button>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Codigo</th>
                <th className="p-5 text-brand-muted font-medium">Tipo</th>
                <th className="p-5 text-brand-muted font-medium">Valor</th>
                <th className="p-5 text-brand-muted font-medium">Vencimiento</th>
                <th className="p-5 text-brand-muted font-medium">Estado</th>
                <th className="p-5 text-brand-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discounts.map((d) => {
                const expired = isExpired(d);
                return (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="font-mono font-bold text-brand-kinetic-orange text-sm tracking-widest">{d.code}</div>
                      {d.description && <div className="text-xs text-brand-muted mt-0.5">{d.description}</div>}
                    </td>
                    <td className="p-5 text-sm text-white">{d.type === "PORCENTAJE" ? "Porcentaje" : "Monto Fijo"}</td>
                    <td className="p-5 font-bold text-white">
                      {d.type === "PORCENTAJE" ? `${d.value}%` : `$${Number(d.value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="p-5 text-sm">
                      {d.expiresAt ? (
                        <span className={`flex items-center gap-1.5 ${expired ? "text-red-400" : "text-brand-muted"}`}>
                          <Calendar size={13} />
                          {new Date(d.expiresAt).toLocaleDateString("es-MX")}
                          {expired && " (vencido)"}
                        </span>
                      ) : <span className="text-brand-muted">Sin vencimiento</span>}
                    </td>
                    <td className="p-5">
                      <button onClick={() => toggleActive(d)} className="flex items-center gap-2 transition-colors">
                        {d.active && !expired ? (
                          <>
                            <ToggleRight size={22} className="text-brand-growth-neon" />
                            <span className="text-xs text-brand-growth-neon font-medium">Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={22} className="text-brand-muted" />
                            <span className="text-xs text-brand-muted">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-5">
                      <button onClick={() => setDeleteId(d.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-muted">
                    <Tag size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay descuentos creados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Descuento</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Codigo *</label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inp} placeholder="PROMO20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Descripcion</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} placeholder="20% en todo el catalogo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">Tipo *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PORCENTAJE" | "MONTO_FIJO" })} className={inp}>
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO_FIJO">Monto Fijo ($)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">Valor *</label>
                  <input required type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inp} placeholder={form.type === "PORCENTAJE" ? "20" : "100"} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Fecha de vencimiento (opcional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inp} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Creando..." : "Crear Descuento"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Eliminar descuento</h3>
              <p className="text-brand-muted text-sm mt-1">Esta accion no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
