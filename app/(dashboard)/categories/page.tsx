"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, X, Pencil, Trash2, Eye } from "lucide-react";
import { BUSINESS_TYPE_LABELS, type BusinessType } from "@/lib/business-types";

interface Category {
  id: string;
  name: string;
  businessType: string;
  createdAt: string;
  _count: { products: number };
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

const btColors: Record<string, string> = {
  GENERAL: "bg-white/10 text-brand-muted",
  ROPA: "bg-pink-500/15 text-pink-400",
  SUPLEMENTOS: "bg-green-500/15 text-green-400",
  ELECTRONICA: "bg-blue-500/15 text-blue-400",
  FARMACIA: "bg-red-500/15 text-red-400",
  FERRETERIA: "bg-yellow-500/15 text-yellow-400",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [currentBusinessType, setCurrentBusinessType] = useState<BusinessType>("GENERAL");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const [catRes, meRes] = await Promise.all([
      fetch(`/api/categories${showAll ? "?all=1" : ""}`),
      fetch("/api/me"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setCurrentBusinessType((me.organization?.businessType ?? "GENERAL") as BusinessType);
    }
    setLoading(false);
  }, [showAll]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openCreate() {
    setEditing(null);
    setName("");
    setError("");
    setShowModal(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setShowModal(false);
      fetchCategories();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? "No se pudo eliminar");
    }
    setDeleteId(null);
    fetchCategories();
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Categorias</h1>
          <p className="text-brand-muted mt-1">Organiza tus productos por categoria</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nueva Categoria
        </button>
      </header>

      <div className="flex items-center gap-3 animate-pop">
        <button
          onClick={() => setShowAll(!showAll)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            showAll
              ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10 text-brand-kinetic-orange"
              : "border-white/10 bg-white/5 text-brand-muted hover:border-white/20"
          }`}
        >
          <Eye size={14} />
          {showAll ? "Mostrando todas" : `Solo ${BUSINESS_TYPE_LABELS[currentBusinessType]}`}
        </button>
        {!showAll && (
          <span className="text-xs text-brand-muted">
            {categories.length} categorias de {BUSINESS_TYPE_LABELS[currentBusinessType]}
          </span>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Nombre</th>
                <th className="p-5 text-brand-muted font-medium">Tipo</th>
                <th className="p-5 text-brand-muted font-medium">Productos</th>
                <th className="p-5 text-brand-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5 font-bold text-white">{c.name}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${btColors[c.businessType] ?? btColors.GENERAL}`}>
                      {BUSINESS_TYPE_LABELS[c.businessType as BusinessType] ?? c.businessType}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-kinetic-orange/10 text-brand-kinetic-orange">
                      {c._count.products} productos
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors" title={c._count.products > 0 ? "Tiene productos asignados" : "Eliminar"}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-brand-muted">
                    <Layers size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{showAll ? "No hay categorias creadas." : `No hay categorias de ${BUSINESS_TYPE_LABELS[currentBusinessType]}.`}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">{editing ? "Editar Categoria" : "Nueva Categoria"}</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="ej: Proteinas, Vitaminas..." />
                <p className="text-xs text-brand-muted mt-1">Se asignara automaticamente a {BUSINESS_TYPE_LABELS[currentBusinessType]}</p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Categoria"}
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
              <h3 className="text-lg font-bold text-white">Eliminar categoria</h3>
              <p className="text-brand-muted text-sm mt-1">Los productos quedaran sin categoria. No se puede deshacer.</p>
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
