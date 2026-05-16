"use client";

import { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  PLAN_PRICES_BOB,
  PLAN_META,
  PLAN_LIMITS,
  ADDON_META,
  type PlanType,
  type AddonType,
} from "@/lib/plans";

const PLAN_ORDER: PlanType[] = ["BASICO", "CRECER", "PRO", "EMPRESARIAL"];

const PLAN_BADGES: Partial<Record<PlanType, string>> = {
  PRO: "Popular",
  EMPRESARIAL: "Completo",
};

const PLAN_BORDERS: Record<PlanType, string> = {
  BASICO: "border-white/10",
  CRECER: "border-blue-400/30",
  PRO: "border-blue-500/30",
  EMPRESARIAL: "border-brand-kinetic-orange/40",
};

function formatLimits(plan: PlanType): string {
  const l = PLAN_LIMITS[plan];
  const products = l.maxProducts === Infinity ? "Productos ilimitados" : `${l.maxProducts} productos`;
  const customers = l.maxCustomers === Infinity ? "Clientes ilimitados" : `${l.maxCustomers} clientes`;
  const staff = l.maxStaff === Infinity ? "Usuarios ilimitados" : `${l.maxStaff} usuario${l.maxStaff !== 1 ? "s" : ""}`;
  return `${products} · ${customers} · ${staff}`;
}

const PLAN_FEATURES: Record<PlanType, Array<{ label: string; included: boolean }>> = {
  BASICO: [
    { label: "POS + Inventario + Pedidos", included: true },
    { label: "Categorías de productos", included: true },
    { label: "Corte de caja", included: true },
    { label: "Alertas de stock", included: true },
    { label: "3 descuentos activos", included: true },
    { label: "Reportes de ventas", included: false },
    { label: "Gestión de proveedores", included: false },
    { label: "CSV import/export", included: false },
    { label: "Variantes de productos", included: false },
    { label: "Emails automáticos", included: false },
    { label: "Tienda online", included: false },
    { label: "Sucursales múltiples", included: false },
  ],
  CRECER: [
    { label: "Todo lo del plan Básico", included: true },
    { label: "Variantes de productos", included: true },
    { label: "Descuentos ilimitados", included: true },
    { label: "Reportes de ventas", included: true },
    { label: "Gestión de proveedores", included: true },
    { label: "CSV import/export", included: true },
    { label: "Vencimientos (Farmacia/Suplementos)", included: true },
    { label: "Emails automáticos básicos", included: true },
    { label: "Tienda online", included: false },
    { label: "Sucursales múltiples", included: false },
  ],
  PRO: [
    { label: "Todo lo del plan Crecer", included: true },
    { label: "Productos y clientes ilimitados", included: true },
    { label: "Tienda Online (e-commerce)", included: true },
    { label: "Pagos QR Bolivia", included: true },
    { label: "Registro público de clientes", included: true },
    { label: "Emails automáticos avanzados", included: true },
    { label: "Garantías (Electrónica)", included: true },
    { label: "Sucursales múltiples", included: false },
    { label: "Auditoría completa", included: false },
  ],
  EMPRESARIAL: [
    { label: "Todo lo del plan Pro", included: true },
    { label: "Sucursales ilimitadas", included: true },
    { label: "Roles y permisos avanzados", included: true },
    { label: "Emails avanzados (cumpleaños, inactividad)", included: true },
    { label: "Historial de auditoría", included: true },
    { label: "Facturación SIAT Bolivia", included: true },
    { label: "Exportación contable", included: true },
    { label: "Soporte prioritario <6h", included: true },
  ],
};

const PLAN_SLUGS: Record<PlanType, string> = {
  BASICO: "basico",
  CRECER: "crecer",
  PRO: "pro",
  EMPRESARIAL: "empresarial",
};

function formatPrice(price: number): string {
  return price.toLocaleString("es-BO");
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <Link href="/" className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">GestiOS.</Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-brand-kinetic-orange font-medium hidden sm:block">
            Precios
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-full border border-white/10 text-sm text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="px-4 py-2 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black text-sm font-bold">
            Prueba gratis
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
            Planes para cada etapa
            <br />
            <span className="text-brand-kinetic-orange">de tu negocio</span>
          </h1>
          <p className="text-brand-muted text-lg max-w-xl mx-auto">
            Sin contratos. Sin permanencia. Cambia o cancela cuando quieras.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-sm font-medium">
            Trial de 7 días sin tarjeta de crédito
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!isAnnual ? "text-white" : "text-brand-muted"}`}>Mensual</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? "bg-brand-kinetic-orange" : "bg-white/20"}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${isAnnual ? "left-8" : "left-1"}`} />
            </button>
            <span className={`text-sm ${isAnnual ? "text-white" : "text-brand-muted"}`}>
              Anual <span className="text-brand-kinetic-orange font-bold">(-10%)</span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLAN_ORDER.map((planKey) => {
            const meta = PLAN_META[planKey];
            const monthlyPrice = PLAN_PRICES_BOB[planKey];
            const annualMonthlyPrice = Math.round(monthlyPrice * 0.9);
            const displayPrice = isAnnual ? annualMonthlyPrice : monthlyPrice;
            const annualSavings = isAnnual
              ? `Bs. ${formatPrice((monthlyPrice - annualMonthlyPrice) * 12)} ahorrados/año`
              : null;
            const badge = PLAN_BADGES[planKey];
            const features = PLAN_FEATURES[planKey];

            return (
              <div
                key={planKey}
                className={`relative rounded-3xl border p-6 flex flex-col gap-5 bg-white/[0.02] hover:-translate-y-1 transition-transform duration-300 ${PLAN_BORDERS[planKey]}`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold">
                    {badge}
                  </div>
                )}
                <div>
                  <div className={`text-sm font-bold mb-1 ${meta.color}`}>{meta.label}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-display font-bold text-white">Bs. {formatPrice(displayPrice)}</span>
                    <span className="text-brand-muted text-sm mb-1">/mes</span>
                  </div>
                  {isAnnual && (
                    <div className="text-brand-muted text-xs mt-0.5">Facturado anualmente</div>
                  )}
                  {annualSavings && (
                    <div className="text-brand-kinetic-orange text-xs font-medium mt-1">{annualSavings}</div>
                  )}
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">{formatLimits(planKey)}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check size={15} className="text-brand-growth-neon flex-shrink-0 mt-0.5" />
                      ) : (
                        <X size={15} className="text-white/20 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? "text-white/80" : "text-white/25"}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/signup?plan=${PLAN_SLUGS[planKey]}`}
                  className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    badge
                      ? "bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]"
                      : "border border-white/10 text-white hover:border-white/30"
                  }`}
                >
                  Empezar gratis <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold">Add-ons opcionales</h2>
            <p className="text-brand-muted mt-2 text-sm">Disponibles desde el plan Crecer. Activa solo lo que necesitas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(ADDON_META) as [AddonType, typeof ADDON_META[AddonType]][]).map(([key, addon]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white text-sm">{addon.label}</div>
                    {addon.comingSoon && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px] font-medium whitespace-nowrap">Próximamente</span>
                    )}
                  </div>
                  <div className="text-brand-kinetic-orange font-bold text-sm whitespace-nowrap">{addon.price}</div>
                </div>
                <p className="text-xs text-brand-muted">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold">Comparación detallada</h2>
            <p className="text-brand-muted mt-2 text-sm">Todas las features lado a lado</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-brand-muted font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-white font-bold">Básico</th>
                  <th className="text-center py-3 px-4 text-blue-300 font-bold">Crecer</th>
                  <th className="text-center py-3 px-4 text-blue-400 font-bold">Pro</th>
                  <th className="text-center py-3 px-4 text-brand-kinetic-orange font-bold">Empresarial</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["POS + Inventario", true, true, true, true],
                  ["Pedidos con tracking", true, true, true, true],
                  ["Corte de caja", true, true, true, true],
                  ["Alertas de stock", true, true, true, true],
                  ["Descuentos", "3", "Ilimitados", "Ilimitados", "Ilimitados"],
                  ["Variantes de productos", false, true, true, true],
                  ["Reportes de ventas", false, true, true, true],
                  ["Proveedores", false, true, true, true],
                  ["CSV import/export", false, true, true, true],
                  ["Vencimientos", false, true, true, true],
                  ["Emails automáticos", false, true, true, true],
                  ["Tienda online", false, false, true, true],
                  ["Pagos QR Bolivia", false, false, true, true],
                  ["Garantías", false, false, true, true],
                  ["Sucursales múltiples", false, false, false, true],
                  ["Roles avanzados", false, false, false, true],
                  ["Audit log", false, false, false, true],
                  ["Facturación SIAT", false, false, false, true],
                  ["Export contable", false, false, false, true],
                  ["Soporte prioritario", false, false, false, true],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white/80">{row[0]}</td>
                    {[1, 2, 3, 4].map((col) => (
                      <td key={col} className="py-3 px-4 text-center">
                        {typeof row[col] === "boolean" ? (
                          row[col] ? (
                            <Check size={15} className="text-brand-growth-neon mx-auto" />
                          ) : (
                            <X size={15} className="text-white/20 mx-auto" />
                          )
                        ) : (
                          <span className="text-white/60">{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-display font-bold">¿Listo para empezar?</h2>
          <p className="text-brand-muted">7 días gratis, sin tarjeta de crédito.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold shadow-[0_0_30px_rgba(255,107,0,0.3)] hover:shadow-[0_0_50px_rgba(255,107,0,0.5)] transition-all"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-brand-muted">
        GestiOS · Sistema de gestión para negocios en Bolivia y Latinoamérica
      </footer>
    </div>
  );
}
