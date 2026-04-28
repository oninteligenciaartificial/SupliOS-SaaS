"use client";

import { useState, useEffect } from "react";
import { User, Building2, Lock, Save, Activity, Link, Copy, Check, CreditCard, Receipt, Package } from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface Profile {
  name: string;
  role: string;
  plan?: PlanType;
  planExpiresAt?: string | null;
  trialEndsAt?: string | null;
  organization?: {
    name: string;
    slug: string;
    phone?: string;
    address?: string;
    rfc?: string;
    logoUrl?: string;
    currency?: string;
  };
}

interface LogEntry {
  id: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const sel = `${inp} appearance-none bg-[#1a1a1a] [&>option]:bg-[#1a1a1a] [&>option]:text-white`;

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgRfc, setOrgRfc] = useState("");
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [orgCurrency, setOrgCurrency] = useState("BOB");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(async (r) => {
      if (r.ok) {
        const data: Profile = await r.json();
        setProfile(data);
        setName(data.name);
        setOrgName(data.organization?.name ?? "");
        setOrgPhone(data.organization?.phone ?? "");
        setOrgAddress(data.organization?.address ?? "");
        setOrgRfc(data.organization?.rfc ?? "");
        setOrgLogoUrl(data.organization?.logoUrl ?? "");
        setOrgCurrency(data.organization?.currency ?? "BOB");
      }
    });
  }, []);

  async function loadLogs() {
    const res = await fetch("/api/activity-log?limit=50");
    if (res.ok) setLogs(await res.json());
    setShowLogs(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, orgName, orgPhone, orgAddress, orgRfc, orgLogoUrl, orgCurrency }),
    });
    setMsg(res.ok ? "Cambios guardados." : "Error al guardar.");
    setSaving(false);
  }

  if (!profile) return <div className="p-8 text-brand-muted">Cargando...</div>;

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header className="animate-pop">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Configuracion</h1>
        <p className="text-brand-muted mt-1">Administra tu perfil y datos de la tienda.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
              <User size={18} className="text-brand-kinetic-orange" />
            </div>
            <h2 className="font-display font-bold text-white">Mi Perfil</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Tu nombre" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Rol</label>
            <input value={profile.role} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
          </div>
        </section>

        {isAdmin && (
          <section className="glass-panel p-6 rounded-3xl animate-pop">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                  <Receipt size={18} className="text-brand-kinetic-orange" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white">Facturación y Plan</h2>
                  <p className="text-xs text-brand-muted mt-0.5">Gestiona tu plan, pagos y solicitudes</p>
                </div>
              </div>
              <a href="/billing" className="text-sm font-bold text-brand-kinetic-orange hover:underline">
                Gestionar →
              </a>
            </div>
          </section>
        )}

      {isAdmin && (
          <section className="glass-panel p-6 rounded-3xl animate-pop">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                  <Package size={18} className="text-brand-kinetic-orange" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white">Add-ons</h2>
                  <p className="text-xs text-brand-muted mt-0.5">Funciones adicionales habilitadas en tu plan</p>
                </div>
              </div>
              <a href="/addons" className="text-sm font-bold text-brand-kinetic-orange hover:underline">
                Ver add-ons →
              </a>
            </div>
          </section>
        )}

      {isAdmin && profile.organization && (
          <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-growth-neon/10">
                <Building2 size={18} className="text-brand-growth-neon" />
              </div>
              <h2 className="font-display font-bold text-white">Mi Tienda</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre de la tienda</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inp} placeholder="Nombre" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Telefono</label>
                <input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className={inp} placeholder="591 2 2345678" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">NIT</label>
                <input value={orgRfc} onChange={(e) => setOrgRfc(e.target.value)} className={inp} placeholder="1234567890" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Moneda</label>
                <select value={orgCurrency} onChange={(e) => setOrgCurrency(e.target.value)} className={sel} style={{ colorScheme: "dark" }}>
                  <option value="BOB">BOB — Boliviano</option>
                  <option value="USD">USD — Dolar Americano</option>
                  <option value="MXN">MXN — Peso Mexicano</option>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="ARS">ARS — Peso Argentino</option>
                  <option value="PEN">PEN — Sol Peruano</option>
                  <option value="CLP">CLP — Peso Chileno</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Direccion</label>
              <input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className={inp} placeholder="Calle, ciudad" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Logo (URL de imagen)</label>
              <input value={orgLogoUrl} onChange={(e) => setOrgLogoUrl(e.target.value)} className={inp} placeholder="https://..." />
              {orgLogoUrl && (
                <img src={orgLogoUrl} alt="Logo" className="h-14 mt-2 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          </section>
        )}

        <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/5">
              <Lock size={18} className="text-brand-muted" />
            </div>
            <h2 className="font-display font-bold text-white">Contrasena</h2>
          </div>
          <p className="text-sm text-brand-muted">Para cambiar tu contrasena, usa el enlace de recuperacion desde la pantalla de login.</p>
        </section>

        {msg && <p className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-brand-growth-neon"}`}>{msg}</p>}

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {isAdmin && profile.organization?.slug && (
        <RegistroLink slug={profile.organization.slug} />
      )}

      {profile.plan && (
        <PlanSection plan={profile.plan} planExpiresAt={profile.planExpiresAt ?? null} trialEndsAt={profile.trialEndsAt ?? null} />
      )}

      {isAdmin && (
        <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Activity size={18} className="text-brand-muted" />
              </div>
              <h2 className="font-display font-bold text-white">Log de Actividad</h2>
            </div>
            {!showLogs && (
              <button onClick={loadLogs} className="text-sm text-brand-kinetic-orange hover:underline">
                Ver historial
              </button>
            )}
          </div>
          {showLogs && (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-brand-muted text-sm py-4 text-center">Sin actividad registrada.</p>
              ) : logs.map((log) => (
                <div key={log.id} className="py-3 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{log.userName}</span>
                    <span className="text-xs text-brand-muted">{new Date(log.createdAt).toLocaleString("es-MX")}</span>
                  </div>
                  <p className="text-xs text-brand-muted">
                    <span className="text-brand-kinetic-orange">{log.action}</span> · {log.entity}
                    {log.details && <span> · {log.details}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PlanSection({ plan, planExpiresAt, trialEndsAt }: { plan: PlanType; planExpiresAt: string | null; trialEndsAt: string | null }) {
  const meta = PLAN_META[plan];
  const now = Date.now();

  const expiresMs = planExpiresAt ? new Date(planExpiresAt).getTime() : null;
  const trialMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null;

  const daysLeft = expiresMs ? Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)) : null;
  const inTrial = trialMs && trialMs > now;
  const trialDaysLeft = inTrial ? Math.ceil((trialMs - now) / (1000 * 60 * 60 * 24)) : null;

  const statusColor = daysLeft === null ? "text-brand-muted" : daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-yellow-400" : "text-brand-growth-neon";

  return (
    <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
          <CreditCard size={18} className="text-brand-kinetic-orange" />
        </div>
        <h2 className="font-display font-bold text-white">Mi Plan</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-brand-muted mb-1">Plan actual</div>
          <div className={`font-bold text-lg ${meta.color}`}>{meta.label}</div>
          <div className="text-xs text-brand-muted">{meta.price}</div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-brand-muted mb-1">Vencimiento</div>
          <div className="font-bold text-white text-sm">
            {planExpiresAt
              ? new Date(planExpiresAt).toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" })
              : "Sin fecha"}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-brand-muted mb-1">Estado</div>
          {inTrial ? (
            <div className="font-bold text-blue-400 text-sm">Trial · {trialDaysLeft}d</div>
          ) : daysLeft === null ? (
            <div className="font-bold text-brand-muted text-sm">Sin vencimiento</div>
          ) : daysLeft < 0 ? (
            <div className="font-bold text-red-400 text-sm">Vencido</div>
          ) : (
            <div className={`font-bold text-sm ${statusColor}`}>{daysLeft} dias restantes</div>
          )}
        </div>
      </div>

      <p className="text-xs text-brand-muted">Para renovar o cambiar de plan, contacta a soporte de GestiOS.</p>
    </section>
  );
}

function RegistroLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/registro/${slug}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
          <Link size={18} className="text-brand-kinetic-orange" />
        </div>
        <div>
          <h2 className="font-display font-bold text-white">Link de Registro de Clientes</h2>
          <p className="text-xs text-brand-muted mt-0.5">Comparte este link o genera un QR para que tus clientes se registren.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-brand-muted font-mono truncate">
          {url}
        </div>
        <button
          onClick={copy}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors"
        >
          {copied ? <Check size={14} className="text-brand-growth-neon" /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </section>
  );
}
