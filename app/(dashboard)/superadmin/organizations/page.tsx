"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Building2, Pencil, Trash2, LogIn } from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface Org {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  plan: PlanType;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  _count: { profiles: number; products: number; orders: number };
}

function TrialBadge({ trialEndsAt, plan, planExpiresAt }: { trialEndsAt: string | null; plan: PlanType; planExpiresAt: string | null }) {
  if (!trialEndsAt) return null;
  const trialDate = new Date(trialEndsAt);
  const now = new Date();
  if (trialDate > now) {
    const diff = Math.max(1, Math.ceil((trialDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 ml-1.5">
        Trial: {diff}d
      </span>
    );
  }
  // Expired trial — only show badge if no active paid plan
  if (plan === "BASICO" && !planExpiresAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-red-300 bg-red-400/10 border border-red-400/20 ml-1.5">
        Trial expirado
      </span>
    );
  }
  return null;
}

const PLANS: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];
const EMPTY_CREATE = { orgName: "", adminName: "", adminEmail: "", adminPassword: "", plan: "BASICO" as PlanType };
const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

function PlanBadge({ plan }: { plan: PlanType }) {
  const meta = PLAN_META[plan];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color} ${meta.bg} border border-white/10`}>
      {meta.label}
    </span>
  );
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", plan: "BASICO" as PlanType, planExpiresAt: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [extendingTrial, setExtendingTrial] = useState<string | null>(null);

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
      body: JSON.stringify({ orgName: createForm.orgName, adminName: createForm.adminName, adminEmail: createForm.adminEmail, adminPassword: createForm.adminPassword, plan: createForm.plan }),
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
    const expiresAt = org.planExpiresAt ? new Date(org.planExpiresAt).toISOString().split("T")[0] : "";
    setEditForm({ name: org.name, phone: org.phone ?? "", address: org.address ?? "", plan: org.plan, planExpiresAt: expiresAt });
    setEditError("");
  }

  function renewDays(days: number) {
    const base = editForm.planExpiresAt && new Date(editForm.planExpiresAt) > new Date()
      ? new Date(editForm.planExpiresAt)
      : new Date();
    base.setDate(base.getDate() + days);
    setEditForm({ ...editForm, planExpiresAt: base.toISOString().split("T")[0] });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrg) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/superadmin/organizations/${editOrg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        plan: editForm.plan,
        planExpiresAt: editForm.planExpiresAt ? new Date(editForm.planExpiresAt + "T23:59:59Z").toISOString() : null,
      }),
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

  async function handleEnterOrg(orgId: string) {
    setEntering(orgId);
    await fetch("/api/superadmin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    router.push("/");
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/superadmin/organizations/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchOrgs();
  }

  async function extendTrial(orgId: string, days: number) {
    setExtendingTrial(orgId);
    await fetch(`/api/superadmin/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_trial", days }),
    });
    setExtendingTrial(null);
    fetchOrgs();
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 animate-pop">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Organizaciones</h1>
          <p className="text-brand-muted mt-1">Todas las tiendas en la plataforma</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); setSuccess(""); }}
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all self-start sm:self-auto"
        >
          <Plus size={18} /> Nueva Tienda
        </button>
      </header>

      {success && (
        <div className="p-4 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30 text-brand-growth-neon text-sm font-medium">
          {success}
        </div>
      )}

      {/* Desktop table */}
      <div className="glass-panel rounded-2xl overflow-hidden animate-pop hidden sm:block">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Tienda</th>
                <th className="p-5 text-brand-muted font-medium">Plan</th>
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
                  <td className="p-5">
                    <div className="flex items-center flex-wrap gap-y-1">
                      <PlanBadge plan={org.plan} />
                      <TrialBadge trialEndsAt={org.trialEndsAt} plan={org.plan} planExpiresAt={org.planExpiresAt} />
                    </div>
                  </td>
                  <td className="p-5 text-white">{org._count.profiles}</td>
                  <td className="p-5 text-white">{org._count.products}</td>
                  <td className="p-5 text-white">{org._count.orders}</td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(org.createdAt).toLocaleDateString("es-MX")}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleEnterOrg(org.id)}
                        disabled={entering === org.id}
                        title="Ver panel de esta tienda"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-kinetic-orange/10 text-brand-kinetic-orange hover:bg-brand-kinetic-orange/20 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <LogIn size={13} /> {entering === org.id ? "Entrando..." : "Entrar"}
                      </button>
                      <button
                        onClick={() => extendTrial(org.id, 7)}
                        disabled={extendingTrial === org.id}
                        title="Extender trial 7 dias"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        {extendingTrial === org.id ? "..." : "+7d trial"}
                      </button>
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
                  <td colSpan={7} className="py-16 text-center text-brand-muted">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay tiendas aun.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3 animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : orgs.length === 0 ? (
          <div className="py-16 text-center text-brand-muted">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay tiendas aun.</p>
          </div>
        ) : orgs.map((org) => (
          <div key={org.id} className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-white">{org.name}</div>
                <div className="text-xs text-brand-muted font-mono mt-0.5">{org.slug}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <PlanBadge plan={org.plan} />
                <TrialBadge trialEndsAt={org.trialEndsAt} plan={org.plan} planExpiresAt={org.planExpiresAt} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["Usuarios", org._count.profiles], ["Productos", org._count.products], ["Pedidos", org._count.orders]].map(([label, val]) => (
                <div key={label as string} className="bg-white/5 rounded-xl p-2">
                  <div className="text-white font-bold text-base">{val}</div>
                  <div className="text-brand-muted text-xs">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => handleEnterOrg(org.id)}
                disabled={entering === org.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-kinetic-orange/10 text-brand-kinetic-orange hover:bg-brand-kinetic-orange/20 transition-colors text-xs font-medium disabled:opacity-50"
              >
                <LogIn size={13} /> {entering === org.id ? "Entrando..." : "Entrar"}
              </button>
              <button
                onClick={() => extendTrial(org.id, 7)}
                disabled={extendingTrial === org.id}
                className="px-2.5 py-2 rounded-lg bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 transition-colors text-xs font-medium disabled:opacity-50"
              >
                {extendingTrial === org.id ? "..." : "+7d trial"}
              </button>
              <button onClick={() => openEdit(org)} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteId(org.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
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
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((p) => {
                    const meta = PLAN_META[p];
                    const selected = createForm.plan === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, plan: p })}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          selected
                            ? `${meta.bg} ${meta.color} border-current`
                            : "bg-white/5 text-brand-muted border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>{meta.label}</div>
                        <div className="font-normal opacity-70 mt-0.5">{meta.price}</div>
                      </button>
                    );
                  })}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
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
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Plan</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLANS.map((p) => {
                    const meta = PLAN_META[p];
                    const selected = editForm.plan === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, plan: p })}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          selected
                            ? `${meta.bg} ${meta.color} border-current`
                            : "bg-white/5 text-brand-muted border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>{meta.label}</div>
                        <div className="font-normal opacity-70 mt-0.5">{meta.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-brand-muted">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={editForm.planExpiresAt}
                  onChange={(e) => setEditForm({ ...editForm, planExpiresAt: e.target.value })}
                  className={input}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => renewDays(30)} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-brand-muted hover:text-white hover:border-brand-kinetic-orange transition-colors">
                    +30 dias
                  </button>
                  <button type="button" onClick={() => renewDays(90)} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-brand-muted hover:text-white hover:border-brand-kinetic-orange transition-colors">
                    +90 dias
                  </button>
                  <button type="button" onClick={() => renewDays(365)} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-brand-muted hover:text-white hover:border-brand-kinetic-orange transition-colors">
                    +1 ano
                  </button>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-2">
                <label className="text-sm text-brand-muted">Extender trial</label>
                <div className="flex gap-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={extendingTrial === editOrg?.id}
                      onClick={async () => {
                        if (!editOrg) return;
                        await extendTrial(editOrg.id, d);
                        setEditOrg(null);
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-yellow-400/20 text-xs text-yellow-300 hover:bg-yellow-400/10 transition-colors disabled:opacity-50"
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 space-y-6 text-center">
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
