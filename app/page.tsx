import Link from "next/link";
import { Check, Store, Shirt, Pill, Monitor, Wrench, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const FEATURES = [
  "POS + Inventario + Pedidos",
  "Clientes con historial de compras",
  "Reportes de ventas y margen",
  "Descuentos y promociones",
  "Corte de caja diario",
  "Alertas de stock automaticas",
  "Sucursales multiples",
  "Emails automaticos a clientes",
];

const BUSINESS_TYPES = [
  { icon: Store, label: "General", desc: "Productos variados" },
  { icon: Shirt, label: "Ropa", desc: "Tallas y colores" },
  { icon: Dumbbell, label: "Suplementos", desc: "Sabores y vencimientos" },
  { icon: Monitor, label: "Electronica", desc: "Garantias y modelos" },
  { icon: Pill, label: "Farmacia", desc: "Dosis y lotes" },
  { icon: Wrench, label: "Ferreteria", desc: "Medidas y materiales" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { role: true } });
    if (profile?.role === "SUPERADMIN") redirect("/superadmin");
    else if (profile) redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">GestiOS.</div>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-brand-muted hover:text-white transition-colors hidden sm:block">
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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-medium">
          7 dias gratis · Sin tarjeta de credito
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight leading-tight">
          El sistema que se adapta
          <br />
          <span className="text-brand-kinetic-orange">a tu tipo de negocio</span>
        </h1>

        <p className="text-brand-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          POS, inventario, pedidos, clientes y reportes. Con etiquetas, atributos y funciones especificas para ropa, farmacia, electronica, suplementos, ferreteria y mas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-base shadow-[0_0_30px_rgba(255,107,0,0.4)] hover:shadow-[0_0_50px_rgba(255,107,0,0.6)] transition-all"
          >
            Empezar gratis
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-full border border-white/10 text-white text-base hover:border-white/30 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </section>

      {/* Business Types */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold mb-2">Un sistema, muchos negocios</h2>
          <p className="text-brand-muted text-sm">La interfaz cambia segun tu tipo de negocio</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {BUSINESS_TYPES.map((bt) => (
            <div key={bt.label} className="glass-panel rounded-2xl p-4 text-center space-y-2 hover:border-brand-kinetic-orange/30 transition-colors">
              <bt.icon size={24} className="text-brand-kinetic-orange mx-auto" />
              <div className="text-white text-sm font-medium">{bt.label}</div>
              <div className="text-brand-muted text-xs">{bt.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="glass-panel rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl font-display font-bold text-center mb-8">Todo incluido desde el primer dia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-kinetic-orange/15 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-brand-kinetic-orange" />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center space-y-6">
        <h2 className="text-2xl font-display font-bold">Planes desde <span className="text-brand-kinetic-orange">Bs. 350/mes</span></h2>
        <p className="text-brand-muted">Sin contratos. Sin permanencia. Paga con QR o transferencia bancaria.</p>
        <Link href="/pricing" className="inline-block px-6 py-3 rounded-full border border-white/10 text-sm text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors">
          Ver todos los planes →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-brand-muted">
        GestiOS · Sistema de gestion para negocios en Bolivia y Latinoamerica
      </footer>
    </div>
  );
}
