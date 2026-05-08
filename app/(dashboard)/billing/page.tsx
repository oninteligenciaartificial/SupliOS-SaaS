"use client";

import { useState, useEffect } from "react";
import { PLAN_META, PLAN_PRICES_BOB, PLAN_FEATURES, ADDON_META, type PlanType } from "@/lib/plans";
import { Check, QrCode, Copy, MessageCircle, ChevronDown, ChevronUp, Trash2, Zap, X } from "lucide-react";

const PLANS: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];
const ALL_ADDONS = ["WHATSAPP", "FACTURACION", "QR_BOLIVIA", "ECOMMERCE", "CONTABILIDAD"] as const;
type AddonType = typeof ALL_ADDONS[number];
const WA_NUMBER = "59175470140";

const ALL_FEATURES: { label: string; plans: PlanType[] }[] = [
  { label: "Dashboard", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Punto de Venta", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Inventario", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Variantes de productos", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Pedidos", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Clientes", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Corte de Caja", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Descuentos ilimitados", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Categorias", plans: ["BASICO", "CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Reportes avanzados", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Proveedores", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Import/Export CSV", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Vencimientos", plans: ["CRECER", "PRO", "EMPRESARIAL"] },
  { label: "Tienda Online", plans: ["PRO", "EMPRESARIAL"] },
  { label: "Registro Público", plans: ["PRO", "EMPRESARIAL"] },
  { label: "Pagos QR Bolivia", plans: ["PRO", "EMPRESARIAL"] },
  { label: "Email marketing", plans: ["PRO", "EMPRESARIAL"] },
  { label: "Garantías", plans: ["PRO", "EMPRESARIAL"] },
  { label: "Sucursales multiples", plans: ["EMPRESARIAL"] },
  { label: "Auditoría (Audit Log)", plans: ["EMPRESARIAL"] },
  { label: "Facturación SIAT", plans: ["EMPRESARIAL"] },
  { label: "Roles avanzados", plans: ["EMPRESARIAL"] },
];

const ADDON_WA_MSG: Record<AddonType, string> = {
  WHATSAPP:    "Hola! Me interesa activar el add-on *WhatsApp Business* ($40/mes) en GestiOS. ¿Cómo procedo?",
  FACTURACION: "Hola! Me interesa el add-on de *Facturación SIAT* para Bolivia en GestiOS. ¿Cuándo estará disponible?",
  QR_BOLIVIA: "Hola! Quiero activar el add-on de *Pagos QR Bolivia* ($15/mes) en GestiOS. ¿Cómo procedo?",
  ECOMMERCE:   "Hola! Me interesa el add-on de *E-commerce* ($20/mes) en GestiOS. ¿Cómo procedo?",
  CONTABILIDAD:"Hola! Quiero activar la *Exportación Contable* ($18/mes) en GestiOS. ¿Cómo procedo?",
};

const MONTH_DISCOUNT: Record<number, number> = { 1: 0, 3: 5, 6: 10, 12: 15 };

function calcTotal(pricePerMonth: number, months: number): number {
  const discount = MONTH_DISCOUNT[months] ?? 0;
  return Math.round(pricePerMonth * months * (1 - discount / 100));
}

const PLAN_WA_MSG: Record<PlanType, (org: string, months: number, total: number) => string> = {
  BASICO:      (org, m, t) => `Hola! Quiero contratar el *Plan Básico* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Básico ($39/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  CRECER:      (org, m, t) => `Hola! Quiero contratar el *Plan Crecer* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Crecer ($59/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  PRO:         (org, m, t) => `Hola! Quiero contratar el *Plan Pro* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Pro ($89/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
  EMPRESARIAL: (org, m, t) => `Hola! Quiero contratar el *Plan Empresarial* de GestiOS para mi tienda *${org}*.\n\n📦 Plan: Empresarial ($139/mes)\n📅 Meses: ${m}\n💰 Total: Bs. ${t}\n\nPor favor confirmen mi pago.`,
};

type PaymentRequest = {
  id: string;
  plan: PlanType;
  months: number;
  amountBOB: number;
  reference: string | null;
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
  createdAt: string;
};

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("BASICO");
  const [months, setMonths] = useState(1);
  const [orgName, setOrgName] = useState("mi tienda");
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [addons, setAddons] = useState<{ addon: AddonType; active: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const pricePerMonth = PLAN_PRICES_BOB[selectedPlan];
  const discount = MONTH_DISCOUNT[months] ?? 0;
  const total = calcTotal(pricePerMonth, months);

  useEffect(() => {
    fetch("/api/payments")
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []));
    fetch("/api/me")
      .then(r => r.json())
      .then(data => { if (data.organization?.name) setOrgName(data.organization.name); });
    fetch("/api/addons")
      .then(r => r.ok ? r.json() : [])
      .then(data => setAddons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function openWhatsApp() {
    const msg = PLAN_WA_MSG[selectedPlan](orgName, months, total);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function cancelRequest(id: string) {
    setCancelling(id);
    await fetch(`/api/payments?id=${id}`, { method: "DELETE" });
    const data = await fetch("/api/payments").then(r => r.json());
    setRequests(Array.isArray(data) ? data : []);
    setCancelling(null);
  }

  function copyNumber() {
    navigator.clipboard.writeText("1311455296");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pending = requests.find(r => r.status === "PENDIENTE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Facturación y Plan</h1>
        <p className="text-brand-muted mt-1 text-sm">Elige tu plan y coordina el pago por WhatsApp</p>
      </header>

      {/* Solicitudes — colapsable */}
      {requests.length > 0 && (
        <section className="glass-panel rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Solicitudes recientes</span>
              {pending && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                  1 pendiente
                </span>
              )}
            </div>
            {showHistory ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
          </button>

          {showHistory && (
            <div className="px-5 pb-5 space-y-2 border-t border-white/5">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-white font-medium text-sm">{PLAN_META[r.plan].label} · {r.months} mes{r.months > 1 ? "es" : ""}</span>
                    <span className="text-brand-muted text-xs ml-2">Bs. {Number(r.amountBOB).toLocaleString("es-BO")}</span>
                    <div className="text-brand-muted text-xs">{new Date(r.createdAt).toLocaleDateString("es-BO")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      r.status === "CONFIRMADO" ? "bg-green-500/15 text-green-400" :
                      r.status === "RECHAZADO"  ? "bg-red-500/15 text-red-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {r.status === "CONFIRMADO" ? "Confirmado" : r.status === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                    </span>
                    {r.status === "PENDIENTE" && (
                      <button
                        onClick={() => cancelRequest(r.id)}
                        disabled={cancelling === r.id}
                        className="text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Cancelar solicitud"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selector de plan */}
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Elige tu plan</h2>
            <div className="space-y-2">
              {PLANS.map(plan => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    selectedPlan === plan
                      ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <span className="text-white font-medium text-sm">{PLAN_META[plan].label}</span>
                    <span className="text-brand-muted text-xs ml-2">Bs. {PLAN_PRICES_BOB[plan].toLocaleString("es-BO")}/mes</span>
                  </div>
                  {selectedPlan === plan && <Check size={16} className="text-brand-kinetic-orange flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Meses a pagar</h2>
            <div className="flex gap-2">
              {[1, 3, 6, 12].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all relative ${
                    months === m
                      ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10 text-brand-kinetic-orange"
                      : "border-white/10 text-brand-muted hover:border-white/20"
                  }`}
                >
                  {m === 1 ? "1 mes" : `${m}m`}
                  {MONTH_DISCOUNT[m] > 0 && (
                    <span className="absolute -top-2 -right-1 text-[9px] font-bold bg-brand-growth-neon text-black px-1 rounded-full">
                      -{MONTH_DISCOUNT[m]}%
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-brand-muted text-sm">Total a pagar</span>
                {discount > 0 && (
                  <div className="text-xs text-brand-growth-neon mt-0.5">
                    Ahorras Bs. {(pricePerMonth * months - total).toLocaleString("es-BO")} ({discount}% off)
                  </div>
                )}
              </div>
              <span className="text-2xl font-display font-bold text-brand-kinetic-orange">
                Bs. {total.toLocaleString("es-BO")}
              </span>
            </div>

            <button
              onClick={openWhatsApp}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)]"
            >
              <MessageCircle size={18} /> Solicitar Plan {PLAN_META[selectedPlan].label} por WhatsApp
            </button>
            <p className="text-xs text-brand-muted text-center">
              Se abrirá WhatsApp con un mensaje listo para enviar
            </p>
          </div>
        </div>

        {/* Tabla comparativa de planes */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Comparar planes</span>
            </div>
            {showComparison ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
          </button>

          {showComparison && (
            <div className="px-5 pb-5 border-t border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-2 text-brand-muted font-medium">Feature</th>
                      {PLANS.map(p => (
                        <th key={p} className={`text-center py-3 px-2 font-bold text-xs ${PLAN_META[p].color}`}>
                          {PLAN_META[p].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_FEATURES.map((feat, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 px-2 text-white">{feat.label}</td>
                        {PLANS.map(p => (
                          <td key={p} className="text-center py-2.5 px-2">
                            {feat.plans.includes(p) ? (
                              <Check size={14} className="text-brand-growth-neon mx-auto" />
                            ) : (
                              <X size={14} className="text-white/20 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones + QR */}
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-brand-kinetic-orange" />
              <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Cómo pagar</h2>
            </div>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Haz clic en "Solicitar por WhatsApp" — el mensaje ya viene listo con tu plan y monto.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Escanea el QR o transfiere a la cuenta de abajo exactamente <strong className="text-brand-kinetic-orange">Bs. {total.toLocaleString("es-BO")}</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Mándanos el comprobante por WhatsApp. Activamos tu plan en menos de 24 horas.</span>
              </li>
            </ol>

            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-brand-muted mb-0.5">N° de cuenta · Banco Ganadero</div>
                <div className="text-white font-mono font-bold">1311455296</div>
                <div className="text-xs text-brand-muted">Urcullo Montenegro Ruddy</div>
              </div>
              <button onClick={copyNumber} className="text-brand-kinetic-orange text-xs flex items-center gap-1 hover:underline">
                <Copy size={12} /> {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Card QR OnIA */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <img src="/LOGO ONIA.jpeg" alt="OnIA" className="h-8 object-contain" />
              <span className="text-xs text-gray-400 font-medium">Banco Ganadero S.A.</span>
            </div>
            <div className="bg-white flex items-center justify-center px-6 py-2 overflow-hidden">
              <div className="relative w-56 overflow-hidden" style={{ height: "224px" }}>
                <img
                  src="/QR GANADERO GESTIOS.jpeg"
                  alt="QR de pago"
                  className="absolute w-full"
                  style={{ top: "-18%", transform: "scale(1.05)" }}
                />
              </div>
            </div>
            <div className="bg-white px-5 py-4 border-t border-gray-100 space-y-1 text-center">
              <p className="text-gray-800 font-bold text-sm">Urcullo Montenegro Ruddy</p>
              <p className="text-gray-500 text-xs">Cuenta <span className="font-mono font-bold text-gray-700">1311455296</span></p>
              <p className="text-gray-400 text-xs">GestiOS Suscripción · QR Interbancario Bolivia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons */}
      <section className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-brand-kinetic-orange" />
          <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Add-ons disponibles</h2>
        </div>
        <div className="divide-y divide-white/5">
          {ALL_ADDONS.map(addon => {
            const meta = ADDON_META[addon];
            const active = addons.some(a => a.addon === addon && a.active);
            return (
              <div key={addon} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${active ? "bg-brand-kinetic-orange/15" : "bg-white/5"}`}>
                    <Zap size={14} className={active ? "text-brand-kinetic-orange" : "text-brand-muted"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">{meta.label}</span>
                      {meta.comingSoon && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 text-[10px] font-bold">Próximamente</span>
                      )}
                    </div>
                    <span className="text-brand-kinetic-orange text-xs">{meta.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    meta.comingSoon ? "bg-white/5 text-white/25"
                      : active ? "bg-green-500/15 text-green-400"
                      : "bg-white/5 text-brand-muted"
                  }`}>
                    {meta.comingSoon ? <><X size={11} /> Pronto</> : active ? <><Check size={11} /> Activo</> : <><X size={11} /> Inactivo</>}
                  </span>
                  {!meta.comingSoon && !active && (
                    <button
                      onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ADDON_WA_MSG[addon])}`, "_blank")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                    >
                      <MessageCircle size={11} /> Solicitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
