"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Building2, Pencil, Trash2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: { profiles: number; products: number; orders: number };
}

const EMPTY_CREATE = { orgName: "", adminName: "", adminEmail: "", adminPassword: "" };
const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/organizations");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/superadmin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      setSuccess(`Tienda "${createForm.orgName}" creada. Admin: ${createForm.adminEmail} / ${createForm.adminPassword}`);
      setCreateForm(EMPTY_CREATE);
      setShowCreate(false);
      fetchOrgs();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al crear");
    }
    setSaving(false);
  }

  function openEdit(org: Org) {
    setEditOrg(org);
    setEditForm({ name: org.name, phone: org.phone ?? "", address: org.address ?? "" });
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrg) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/superadmin/organizations/${editOrg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, phone: editForm.phone || undefined, address: editForm.address || undefined }),
    });
    if (res.ok) {
      setEditOrg(null);
      fetchOrgs();
    } else {
      const d = await res.json();
      setEditError(d.error ?? "Error al guardar");
    }
    setEditSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/superadmin/organizations/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchOrgs();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Organizaciones</h1>
          <p className="text-brand-muted mt-1">Todas las tiendas en la plataforma</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); setSuccess(""); }}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <Plus size={18} /> Nueva Tienda
        </button>
      </header>

      {success && (
        <div className="p-4 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30 text-brand-growth-neon text-sm font-medium">
          {success}
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Tienda</th>
                <th className="p-5 text-brand-muted font-medium">Usuarios</th>
                <th className="p-5 text-brand-muted font-medium">Productos</th>
                <th className="p-5 text-brand-muted font-medium">Pedidos</th>
                <th className="p-5 text-brand-muted font-medium">Creada</th>
                <th className="p-5 text-brand-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{org.name}</div>
                    <div className="text-xs text-brand-muted font-mono">{org.slug}</div>
                  </td>
                  <td className="p-5 text-white">{org._count.profiles}</td>
                  <td className="p-5 text-white">{org._count.products}</td>
                  <td className="p-5 text-white">{org._count.orders}</td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(org.createdAt).toLocaleDateString("es-MX")}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(org)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(org.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-muted">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay tiendas aun.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Nueva Tienda</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre de la tienda *</label>
                <input required value={createForm.orgName} onChange={(e) => setCreateForm({ ...createForm, orgName: e.target.value })} className={input} placeholder="Tienda XYZ" />
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-brand-muted mb-3 uppercase tracking-wider">Cuenta del Admin</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Nombre *</label>
                    <input required value={createForm.adminName} onChange={(e) => setCreateForm({ ...createForm, adminName: e.target.value })} className={input} placeholder="Nombre del admin" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Email *</label>
                    <input required type="email" value={createForm.adminEmail} onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })} className={input} placeholder="admin@tienda.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-brand-muted">Contrasena temporal *</label>
                    <input required type="text" minLength={8} value={createForm.adminPassword} onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })} className={input} placeholder="Min 8 caracteres" />
                  </div>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {saving ? "Creando..." : "Crear Tienda y Admin"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Editar Tienda</h2>
              <button onClick={() => setEditOrg(null)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre *</label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={input} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Telefono</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={input} placeholder="+52 55 0000 0000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Direccion</label>
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={input} placeholder="Calle, Ciudad" />
              </div>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <button type="submit" disabled={editSaving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-50">
                {editSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Eliminar organizacion</h3>
              <p className="text-brand-muted text-sm mt-1">Se eliminaran todos sus datos. Esta accion no se puede deshacer.</p>
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
