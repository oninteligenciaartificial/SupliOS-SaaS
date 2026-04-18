"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, X, Pencil, Trash2, Phone, Mail } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const EMPTY = { name: "", contact: "", phone: "", email: "", notes: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/suppliers");
    if (res.ok) setSuppliers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact ?? "", phone: s.phone ?? "", email: s.email ?? "", notes: s.notes ?? "" });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      fetchSuppliers();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchSuppliers();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Proveedores</h1>
          <p className="text-brand-muted mt-1">Gestiona tus proveedores de productos</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Proveedor</th>
                <th className="p-5 text-brand-muted font-medium">Contacto</th>
                <th className="p-5 text-brand-muted font-medium">Telefono</th>
                <th className="p-5 text-brand-muted font-medium">Email</th>
                <th className="p-5 text-brand-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{s.name}</div>
                    {s.notes && <div className="text-xs text-brand-muted mt-0.5 truncate max-w-xs">{s.notes}</div>}
                  </td>
                  <td className="p-5 text-white text-sm">{s.contact ?? <span className="text-brand-muted">—</span>}</td>
                  <td className="p-5 text-sm">
                    {s.phone ? (
                      <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-brand-kinetic-orange hover:underline">
                        <Phone size={13} /> {s.phone}
                      </a>
                    ) : <span className="text-brand-muted">—</span>}
                  </td>
                  <td className="p-5 text-sm">
                    {s.email ? (
                      <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-brand-kinetic-orange hover:underline">
                        <Mail size={13} /> {s.email}
                      </a>
                    ) : <span className="text-brand-muted">—</span>}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-brand-muted">
                    <Truck size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay proveedores registrados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Distribuidor XYZ" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Persona de contacto</label>
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inp} placeholder="Juan Lopez" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">Telefono</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+52 55 0000 0000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-brand-muted">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="contacto@proveedor.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Notas</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} placeholder="Condiciones, plazos de entrega, etc." />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Proveedor"}
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
              <h3 className="text-lg font-bold text-white">Eliminar proveedor</h3>
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
