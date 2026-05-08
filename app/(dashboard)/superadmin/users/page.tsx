"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Plus, Trash2, X, CreditCard } from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface UserProfile {
  id: string;
  userId: string;
  name: string;
  role: string;
  organizationId: string | null;
  organization: { name: string; plan?: string; planExpiresAt?: string } | null;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planExpiresAt: string | null;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "STAFF" | "MANAGER" | "VIEWER">("STAFF");
  const [formOrgId, setFormOrgId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [planOrgId, setPlanOrgId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<{ plan: PlanType; planExpiresAt: string }>({ plan: "BASICO", planExpiresAt: "" });
  const [planSaving, setPlanSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  const fetchOrgs = useCallback(async () => {
    const res = await fetch("/api/superadmin/organizations");
    if (res.ok) setOrgs(await res.json());
  }, []);

  useEffect(() => { fetchUsers(); fetchOrgs(); }, [fetchUsers, fetchOrgs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formEmail,
        name: formName,
        role: formRole,
        organizationId: formOrgId || undefined,
        password: formPassword,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFormEmail(""); setFormName(""); setFormRole("STAFF"); setFormOrgId(""); setFormPassword("");
      setShowCreate(false);
      fetchUsers();
    } else {
      setError(data.error || "Error al crear usuario");
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/superadmin/users/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchUsers();
    }
    setDeleting(false);
  };

  const openPlanModal = (u: UserProfile) => {
    if (!u.organizationId) return;
    const org = orgs.find(o => o.id === u.organizationId);
    if (!org) return;
    setPlanOrgId(u.organizationId);
    const expiresAt = org.planExpiresAt
      ? new Date(org.planExpiresAt).toISOString().split("T")[0]
      : "";
    setPlanForm({ plan: (org.plan as PlanType) || "BASICO", planExpiresAt: expiresAt });
  };

  const renewDays = (days: number) => {
    const base = planForm.planExpiresAt && new Date(planForm.planExpiresAt) > new Date()
      ? new Date(planForm.planExpiresAt)
      : new Date();
    base.setDate(base.getDate() + days);
    setPlanForm({ ...planForm, planExpiresAt: base.toISOString().split("T")[0] });
  };

  const handlePlanSave = async () => {
    if (!planOrgId) return;
    setPlanSaving(true);
    const res = await fetch(`/api/superadmin/organizations/${planOrgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: planForm.plan,
        planExpiresAt: planForm.planExpiresAt
          ? new Date(planForm.planExpiresAt + "T23:59:59Z").toISOString()
          : null,
      }),
    });
    if (res.ok) {
      setPlanOrgId(null);
      fetchOrgs();
      fetchUsers();
    }
    setPlanSaving(false);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.organization?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    ADMIN: "bg-brand-kinetic-orange/15 text-brand-kinetic-orange",
    MANAGER: "bg-blue-500/15 text-blue-400",
    STAFF: "bg-white/10 text-brand-muted",
    VIEWER: "bg-purple-500/15 text-purple-400",
  };

  const planColors: Record<PlanType, string> = {
    BASICO: "bg-white/10 text-brand-muted",
    CRECER: "bg-blue-500/15 text-blue-400",
    PRO: "bg-purple-500/15 text-purple-400",
    EMPRESARIAL: "bg-brand-kinetic-orange/15 text-brand-kinetic-orange",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="animate-pop flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Usuarios</h1>
          <p className="text-brand-muted mt-1">Todos los usuarios en la plataforma</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </header>

      <div className="relative animate-pop">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre u organizacion..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Usuario</th>
                <th className="p-5 text-brand-muted font-medium">Rol</th>
                <th className="p-5 text-brand-muted font-medium">Organizacion</th>
                <th className="p-5 text-brand-muted font-medium">Plan</th>
                <th className="p-5 text-brand-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => {
                const orgPlan = (u.organization?.plan as PlanType) || null;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-white">{u.name}</div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors[u.role] ?? roleColors.STAFF}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-5 text-white text-sm">{u.organization?.name ?? <span className="text-brand-muted">—</span>}</td>
                    <td className="p-5">
                      {orgPlan ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${planColors[orgPlan]}`}>
                          {PLAN_META[orgPlan].label}
                        </span>
                      ) : (
                        <span className="text-brand-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1">
                        {u.organizationId && (
                          <button
                            onClick={() => openPlanModal(u)}
                            className="p-2 rounded-lg hover:bg-blue-500/10 text-brand-muted hover:text-blue-400 transition-colors"
                            title="Administrar plan de la organizacion"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-brand-muted">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{search ? "No se encontraron usuarios." : "No hay usuarios aun."}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-right text-brand-muted text-sm animate-pop">
        {filtered.length} de {users.length} usuarios
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={() => setShowCreate(false)}>
          <div
            className="w-full sm:max-w-md bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Usuario</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-brand-muted mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-muted mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-muted mb-1">Contraseña</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                  placeholder="Minimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-muted mb-1">Rol</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-brand-muted mb-1">Organizacion (opcional)</label>
                <select
                  value={formOrgId}
                  onChange={(e) => setFormOrgId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                >
                  <option value="">Sin organizacion</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={() => setDeleteId(null)}>
          <div
            className="w-full sm:max-w-sm bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-display font-bold text-white mb-2">Eliminar Usuario</h2>
            <p className="text-brand-muted text-sm mb-6">Esta accion eliminara al usuario y su cuenta de Supabase. No se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Management Modal */}
      {planOrgId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={() => setPlanOrgId(null)}>
          <div
            className="w-full sm:max-w-md bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white">Administrar Plan</h2>
              <button onClick={() => setPlanOrgId(null)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-brand-muted mb-2">Plan actual</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["BASICO", "CRECER", "PRO", "EMPRESARIAL"] as PlanType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, plan: p })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        planForm.plan === p
                          ? `${PLAN_META[p].bg} ${PLAN_META[p].color} border-brand-kinetic-orange/40`
                          : "bg-white/5 text-brand-muted border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {PLAN_META[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-brand-muted mb-2">Vencimiento</label>
                <input
                  type="date"
                  value={planForm.planExpiresAt}
                  onChange={(e) => setPlanForm({ ...planForm, planExpiresAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => renewDays(30)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-muted hover:bg-white/10 hover:text-white transition-colors">
                    +30 dias
                  </button>
                  <button type="button" onClick={() => renewDays(90)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-muted hover:bg-white/10 hover:text-white transition-colors">
                    +90 dias
                  </button>
                  <button type="button" onClick={() => renewDays(365)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-brand-muted hover:bg-white/10 hover:text-white transition-colors">
                    +1 ano
                  </button>
                </div>
              </div>
              <button
                onClick={handlePlanSave}
                disabled={planSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {planSaving ? "Guardando..." : "Guardar Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
