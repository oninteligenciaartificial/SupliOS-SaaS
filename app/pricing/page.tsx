import { Check, X, QrCode, MessageCircle } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Básico",
    priceBOB: "350",
    priceUSD: "~$50",
    period: "/mes",
    color: "text-white",
    border: "border-white/10",
    badge: null,
    limits: "150 productos · 50 clientes · 1 usuario",
    features: [
      { label: "POS + Inventario + Pedidos", included: true },
      { label: "Categorías de productos", included: true },
      { label: "Corte de caja", included: true },
      { label: "Alertas de stock", included: true },
      { label: "3 descuentos activos", included: true },
      { label: "Reportes de ventas", included: false },
      { label: "Gestión de proveedores", included: false },
      { label: "CSV import/export", included: false },
      { label: "Variantes de productos", included: false },
      { label: "Registro público de clientes", included: false },
      { label: "Emails automáticos", included: false },
      { label: "Sucursales múltiples", included: false },
      { label: "Roles avanzados", included: false },
    ],
  },
  {
    name: "Crecer",
    priceBOB: "530",
    priceUSD: "~$76",
    period: "/mes",
    color: "text-blue-300",
    border: "border-blue-400/30",
    badge: null,
    limits: "500 productos · 300 clientes · 3 usuarios",
    features: [
      { label: "Todo lo del plan Básico", included: true },
      { label: "Variantes de productos", included: true },
      { label: "Descuentos ilimitados", included: true },
      { label: "Reportes de ventas", included: true },
      { label: "Gestión de proveedores", included: true },
      { label: "CSV import/export", included: true },
      { label: "Vencimientos (Farmacia/Suplementos)", included: true },
      { label: "Add-ons opcionales", included: true },
      { label: "Registro público de clientes", included: false },
      { label: "Emails automáticos", included: false },
      { label: "Sucursales múltiples", included: false },
      { label: "Roles avanzados", included: false },
    ],
  },
  {
    name: "Pro",
    priceBOB: "800",
    priceUSD: "~$114",
    period: "/mes",
    color: "text-blue-400",
    border: "border-blue-500/30",
    badge: "Popular",
    limits: "Productos ilimitados · Clientes ilimitados · 10 usuarios",
    features: [
      { label: "Todo lo del plan Crecer", included: true },
      { label: "Productos y clientes ilimitados", included: true },
      { label: "Tienda Online", included: true },
      { label: "Pagos QR Bolivia", included: true },
      { label: "Registro público de clientes", included: true },
      { label: "Emails básicos automáticos", included: true },
      { label: "Garantías (Electrónica)", included: true },
      { label: "Sucursales múltiples", included: false },
      { label: "Roles avanzados", included: false },
      { label: "Auditoría completa", included: false },
    ],
  },
  {
    name: "Empresarial",
    priceBOB: "1.250",
    priceUSD: "~$179",
    period: "/mes",
    color: "text-brand-kinetic-orange",
    border: "border-brand-kinetic-orange/40",
    badge: "Completo",
    limits: "Todo ilimitado · Usuarios ilimitados",
    features: [
      { label: "Todo lo del plan Pro", included: true },
      { label: "Sucursales ilimitadas", included: true },
      { label: "Roles y permisos avanzados", included: true },
      { label: "Emails avanzados (cumpleaños, inactividad)", included: true },
      { label: "Historial de auditoría", included: true },
      { label: "Facturación SIAT Bolivia", included: true },
      { label: "Exportación contable", included: true },
      { label: "Soporte prioritario <6h", included: true },
    ],
  },
];

const ADDONS = [
  { name: "WhatsApp Business",    price: "$40/mes", desc: "300 conversaciones incluidas, excedente $0.08 c/u" },
  { name: "Facturación SIAT",     price: "$25/mes", desc: "Facturas electrónicas según el SIN Bolivia (incluido en Empresarial)" },
  { name: "Pagos QR Bolivia",     price: "$15/mes", desc: "QR bancario, Tigo Money y BiPago (incluido en Pro+)" },
  { name: "E-commerce",           price: "$20/mes", desc: "Tienda online sincronizada con inventario (incluido en Pro)" },
  { name: "Exportación Contable", price: "$18/mes", desc: "CSV/Excel de ventas para tu contador local (incluido en Empresarial)" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
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
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-6 flex flex-col gap-5 bg-white/[0.02] hover:-translate-y-1 transition-transform duration-300 ${plan.border}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold">
                  {plan.badge}
                </div>
              )}
              <div>
                <div className={`text-sm font-bold mb-1 ${plan.color}`}>{plan.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-display font-bold text-white">Bs. {plan.priceBOB}</span>
                  <span className="text-brand-muted text-sm mb-1">{plan.period}</span>
                </div>
                <div className="text-brand-muted text-xs mt-0.5">{plan.priceUSD}/mes</div>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">{plan.limits}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
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
                href="/login"
                className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                  plan.badge
                    ? "bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]"
                    : "border border-white/10 text-white hover:border-white/30"
                }`}
              >
                Empezar gratis
              </Link>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold">Add-ons opcionales</h2>
            <p className="text-brand-muted mt-2 text-sm">Disponibles desde el plan Crecer. Activa solo lo que necesitas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADDONS.map((addon) => (
              <div key={addon.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-white text-sm">{addon.name}</div>
                  <div className="text-brand-kinetic-orange font-bold text-sm">{addon.price}</div>
                </div>
                <p className="text-xs text-brand-muted">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-display font-bold">¿Listo para empezar?</h2>
          <p className="text-brand-muted">7 días gratis, sin tarjeta de crédito.</p>
          <Link
            href="/login"
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
