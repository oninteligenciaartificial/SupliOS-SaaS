"use client";

import { useState, useEffect } from "react";
import { User, Building2, Lock, Save, Activity, Link, Copy, Check, CreditCard, Receipt, Package, ChevronRight } from "lucide-react";
import { PLAN_META, type PlanType } from "@/lib/plans";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS, BUSINESS_TYPE_SCHEMAS } from "@/lib/business-types";
import { Shirt, Pill, ShoppingBag, Wrench, Zap, Store } from "lucide-react";
import type { BusinessType } from "@/lib/business-types";

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
    businessType?: string;
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

type Tab = "perfil" | "tienda" | "facturacion" | "avanzado";

const BUSINESS_ICONS: Record<BusinessType, React.ReactNode> = {
  GENERAL:     <Store size={18} />,
  ROPA:        <Shirt size={18} />,
  SUPLEMENTOS: <ShoppingBag size={18} />,
  ELECTRONICA: <Zap size={18} />,
  FARMACIA:    <Pill size={18} />,
  FERRETERIA:  <Wrench size={18} />,
};

const inp = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";
const sel = `${inp} appearance-none bg-[#1a1a1a] [&>option]:bg-[#1a1a1a] [&>option]:text-white`;

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "perfil", label: "Perfil", icon: <User size={16} /> },
  { id: "tienda", label: "Mi Tienda", icon: <Building2 size={16} /> },
  { id: "facturacion", label: "Facturación", icon: <CreditCard size={16} /> },
  { id: "avanzado", label: "Avanzado", icon: <Lock size={16} /> },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("perfil");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgRfc, setOrgRfc] = useState("");
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [orgCurrency, setOrgCurrency] = useState("BOB");
  const [orgBusinessType, setOrgBusinessType] = useState("GENERAL");
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
        setOrgBusinessType(data.organization?.businessType ?? "GENERAL");
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
      body: JSON.stringify({ name, orgName, orgPhone, orgAddress, orgRfc, orgLogoUrl, orgCurrency, orgBusinessType }),
    });
    setMsg(res.ok ? "Cambios guardados." : "Error al guardar.");
    setSaving(false);
  }

  if (!profile) return <div className="p-8 text-brand-muted">Cargando...</div>;

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <header className="animate-pop">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Configuración</h1>
        <p className="text-brand-muted mt-1">Administra tu perfil y datos de la tienda.</p>
      </header>

      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-brand-kinetic-orange text-black"
                : "text-brand-muted hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <form onSubmit={handleSave} className="space-y-5">
          <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                <User size={18} className="text-brand-kinetic-orange" />
              </div>
              <h2 className="font-display font-bold text-white">Informacion Personal</h2>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Nombre completo</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Tu nombre" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-brand-muted">Rol en la tienda</label>
              <input value={profile.role} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
            </div>
          </section>

          {msg && <p className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-brand-growth-neon"}`}>{msg}</p>}

          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      )}

      {activeTab === "tienda" && (
        <form onSubmit={handleSave} className="space-y-5">
          <section className="glass-panel p-6 rounded-3xl space-y-5 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-growth-neon/10">
                <Building2 size={18} className="text-brand-growth-neon" />
              </div>
              <h2 className="font-display font-bold text-white">Datos de la Tienda</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Nombre de la tienda</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inp} placeholder="Mi Tienda" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Telefono</label>
                <input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className={inp} placeholder="591 2 2345678" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">NIT / Identificacion fiscal</label>
                <input value={orgRfc} onChange={(e) => setOrgRfc(e.target.value)} className={inp} placeholder="1234567890" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Direccion</label>
                <input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className={inp} placeholder="Calle, ciudad" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Moneda predeterminada</label>
                <select value={orgCurrency} onChange={(e) => setOrgCurrency(e.target.value)} className={sel} style={{ colorScheme: "dark" }}>
                  <option value="BOB">BOB — Boliviano</option>
                  <option value="USD">USD — Dolar</option>
                  <option value="MXN">MXN — Peso Mexicano</option>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="ARS">ARS — Peso Argentino</option>
                  <option value="PEN">PEN — Sol Peruano</option>
                  <option value="CLP">CLP — Peso Chileno</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Logo (URL de imagen)</label>
                <input value={orgLogoUrl} onChange={(e) => setOrgLogoUrl(e.target.value)} className={inp} placeholder="https://..." />
                {orgLogoUrl && (
                  <img src={orgLogoUrl} alt="Logo" className="h-14 mt-2 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
            </div>
          </section>

          <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                <Building2 size={18} className="text-brand-kinetic-orange" />
              </div>
              <h2 className="font-display font-bold text-white">Tipo de Negocio</h2>
            </div>
            <p className="text-sm text-brand-muted -mt-2">Define las variantes disponibles para tus productos (talla, color, sabor, etc.)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => {
                const selected = orgBusinessType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrgBusinessType(type)}
                    className={`relative text-left p-4 rounded-2xl border transition-all duration-200 ${
                      selected
                        ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-kinetic-orange flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`mb-2 ${selected ? "text-brand-kinetic-orange" : "text-brand-muted"}`}>
                      {BUSINESS_ICONS[type]}
                    </div>
                    <div className="font-bold text-white text-sm">{BUSINESS_TYPE_LABELS[type]}</div>
                    {BUSINESS_TYPE_SCHEMAS[type] && Object.keys(BUSINESS_TYPE_SCHEMAS[type]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.keys(BUSINESS_TYPE_SCHEMAS[type]).map((attr) => (
                          <span key={attr} className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-xs text-brand-muted capitalize">
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {msg && <p className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-brand-growth-neon"}`}>{msg}</p>}

          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      )}

      {activeTab === "facturacion" && (
        <div className="space-y-5">
          {isAdmin && (
            <section className="glass-panel p-6 rounded-3xl animate-pop">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-kinetic-orange/10">
                    <Receipt size={18} className="text-brand-kinetic-orange" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white">Plan y Facturación</h2>
                    <p className="text-xs text-brand-muted mt-0.5">Gestiona tu plan, pagos y solicitudes</p>
                  </div>
                </div>
                <a href="/billing" className="flex items-center gap-1 text-sm font-bold text-brand-kinetic-orange hover:underline">
                  Gestionar <ChevronRight size={14} />
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
                <a href="/addons" className="flex items-center gap-1 text-sm font-bold text-brand-kinetic-orange hover:underline">
                  Ver <ChevronRight size={14} />
                </a>
              </div>
            </section>
          )}

          {profile.plan && (
            <PlanSection plan={profile.plan} planExpiresAt={profile.planExpiresAt ?? null} trialEndsAt={profile.trialEndsAt ?? null} />
          )}

          {isAdmin && profile.organization?.slug && (
            <RegistroLink slug={profile.organization.slug} />
          )}
        </div>
      )}

      {activeTab === "avanzado" && (
        <div className="space-y-5">
          <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/5">
                <Lock size={18} className="text-brand-muted" />
              </div>
              <h2 className="font-display font-bold text-white">Seguridad</h2>
            </div>
            <p className="text-sm text-brand-muted">Para cambiar tu contrasena, usa el enlace de recuperacion desde la pantalla de login.</p>
          </section>

          {isAdmin && (
            <section className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Activity size={18} className="text-brand-muted" />
                </div>
                <h2 className="font-display font-bold text-white">Log de Actividad</h2>
              </div>
              {!showLogs && (
                <button onClick={loadLogs} className="text-sm text-brand-kinetic-orange hover:underline">
                  Ver historial de actividad
                </button>
              )}
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
