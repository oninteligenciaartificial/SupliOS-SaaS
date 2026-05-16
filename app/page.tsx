import Link from "next/link";
import { Store, Shirt, Pill, Monitor, Wrench, Dumbbell, ArrowRight, Zap, Shield, Clock, Users, TrendingUp, Mail } from "lucide-react";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const FEATURES = [
  { icon: Zap, label: "POS ultrarrápido", desc: "Vendé en segundos con carrito, variantes y descuentos" },
  { icon: Shield, label: "Inventario inteligente", desc: "Stock automático, alertas, variantes por tipo de negocio" },
  { icon: Clock, label: "Pedidos con tracking", desc: "Seguimiento de estados y emails automáticos" },
  { icon: Users, label: "CRM integrado", desc: "Historial de compras, puntos de lealtad, segmentación" },
  { icon: TrendingUp, label: "Reportes en tiempo real", desc: "Ventas, margen, productos top, corte de caja" },
  { icon: Mail, label: "Emails automáticos", desc: "Confirmaciones, cumpleaños, stock bajo, re-engagement" },
];

const BUSINESS_TYPES = [
  { icon: Store, label: "General", desc: "Productos variados" },
  { icon: Shirt, label: "Ropa", desc: "Tallas y colores" },
  { icon: Dumbbell, label: "Suplementos", desc: "Sabores y vencimientos" },
  { icon: Monitor, label: "Electronica", desc: "Garantias y modelos" },
  { icon: Pill, label: "Farmacia", desc: "Dosis y lotes" },
  { icon: Wrench, label: "Ferreteria", desc: "Medidas y materiales" },
];

const STEPS = [
  { step: "1", title: "Creá tu cuenta", desc: "Registro en 30 segundos. Sin tarjeta de crédito." },
  { step: "2", title: "Elegí tu tipo de negocio", desc: "La interfaz se adapta: labels, atributos y funciones específicas." },
  { step: "3", title: "Cargá tus productos", desc: "Manual, por CSV, o con datos de ejemplo automáticos." },
  { step: "4", title: "Empezá a vender", desc: "POS rápido, gestión de pedidos y reportes en tiempo real." },
];

const TESTIMONIALS = [
  { name: "María López", role: "Dueña de farmacia", quote: "Por fin un sistema que entiende que una farmacia no es igual a una ferretería. Los vencimientos me salvan.", initials: "ML", color: "bg-[#FF6B00]" },
  { name: "Carlos Rojas", role: "Tienda de ropa", quote: "Las variantes de talla y color funcionan perfecto. Antes usaba 3 hojas de cálculo.", initials: "CR", color: "bg-[#00af74]" },
  { name: "Ana Gutiérrez", role: "Distribuidora de suplementos", quote: "El POS es rapidísimo y los emails automáticos a clientes hicieron que vuelvan más.", initials: "AG", color: "bg-[#ffb693]" },
];

const FAQ = [
  { q: "¿Necesito tarjeta de crédito para probar?", a: "No. 7 días gratis sin pedir tarjeta. Después elegís el plan que mejor te convenga." },
  { q: "¿Puedo cambiar de plan en cualquier momento?", a: "Sí. Subís o bajás de plan cuando quieras. El cambio se aplica inmediatamente." },
  { q: "¿Cómo pago?", a: "Transferencia bancaria (Banco Ganadero), QR bancario, o Tigo Money. También aceptamos pagos internacionales." },
  { q: "¿Mis datos están seguros?", a: "Sí. Base de datos PostgreSQL en Supabase con RLS habilitado. Cada organización solo ve sus propios datos." },
  { q: "¿Funciona en celular?", a: "Sí. La interfaz es 100% responsive. El POS funciona en cualquier dispositivo con navegador." },
  { q: "¿Qué pasa si me quedo sin internet en el POS?", a: "Estamos trabajando en modo offline. Por ahora necesitás conexión para procesar ventas." },
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
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">GestiOS.</div>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-brand-muted hover:text-white transition-colors hidden sm:block">
            Precios
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-full border border-white/10 text-sm text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-all duration-200 min-h-[44px] flex items-center"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2.5 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black text-sm font-bold min-h-[44px] flex items-center hover:opacity-90 transition-opacity duration-200"
          >
            Prueba gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Radial glow behind mockup */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B00]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute right-24 top-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FF6B00]/12 rounded-full blur-[60px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 md:gap-8">
          {/* Left: text */}
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-kinetic-orange/10 border border-brand-kinetic-orange/20 text-brand-kinetic-orange text-xs font-medium">
              7 dias gratis · Sin tarjeta de credito
            </div>

            <h1
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: "clamp(2.25rem, 5vw + 1rem, 4.5rem)" }}
            >
              El sistema que se adapta
              <br />
              <span className="text-brand-kinetic-orange">a tu tipo de negocio</span>
            </h1>

            <p className="text-brand-muted text-lg sm:text-xl max-w-lg leading-relaxed">
              POS, inventario, pedidos, clientes y reportes. Con etiquetas, atributos y funciones especificas para ropa, farmacia, electronica, suplementos, ferreteria y mas.
            </p>

            <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
              <Link
                href="/signup"
                className="min-h-[44px] px-8 py-3 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-base shadow-[0_0_30px_rgba(255,107,0,0.4)] hover:shadow-[0_0_50px_rgba(255,107,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
              >
                Empezar gratis
              </Link>
              <Link
                href="/pricing"
                className="min-h-[44px] px-8 py-3 rounded-full border border-white/10 text-white text-base hover:border-white/30 hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
                aria-label="Ver planes de precios"
              >
                Ver planes <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="flex-1 flex justify-center md:justify-end">
            <DashboardMockup />
          </div>
        </div>

        {/* Orange gradient separator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, #FF6B00 30%, #FF6B00 70%, transparent)" }}
        />
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-20 pt-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-display font-bold mb-2">Empezar es facil</h2>
          <p className="text-brand-muted text-sm">De registro a tu primera venta en menos de 5 minutos</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="glass-panel rounded-2xl p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-brand-kinetic-orange/20 flex items-center justify-center text-brand-kinetic-orange font-bold text-lg">
                {s.step}
              </div>
              <div className="text-white font-bold">{s.title}</div>
              <div className="text-brand-muted text-sm">{s.desc}</div>
            </div>
          ))}
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
            <div
              key={bt.label}
              className="glass-panel rounded-2xl p-4 text-center space-y-2 border border-white/5 hover:border-brand-kinetic-orange/40 hover:shadow-[0_0_16px_rgba(255,107,0,0.15)] transition-all duration-200 cursor-default"
            >
              <bt.icon size={24} className="text-brand-kinetic-orange mx-auto" aria-hidden="true" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.label} className="space-y-2">
                <f.icon size={24} className="text-brand-kinetic-orange" aria-hidden="true" />
                <div className="text-white font-bold text-sm">{f.label}</div>
                <div className="text-brand-muted text-xs">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold mb-2">Lo que dicen nuestros clientes</h2>
          <p className="text-brand-muted text-sm">Negocios reales que ya usan GestiOS</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-panel rounded-2xl p-6 space-y-3 border border-white/8 hover:border-white/15 transition-colors duration-200">
              <div className="text-white/80 text-sm italic leading-relaxed">"{t.quote}"</div>
              <div className="border-t border-white/5 pt-3 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-[10px] font-bold text-black shrink-0`}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-white text-sm font-bold">{t.name}</div>
                  <div className="text-brand-muted text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center space-y-6">
        <h2 className="text-2xl font-display font-bold">Planes desde <span className="text-brand-kinetic-orange">Bs. 350/mes</span></h2>
        <p className="text-brand-muted">Sin contratos. Sin permanencia. Paga con QR o transferencia bancaria.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center min-h-[44px] px-6 py-3 rounded-full border border-white/10 text-sm text-white hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-all duration-200"
        >
          Ver todos los planes →
        </Link>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold mb-2">Preguntas frecuentes</h2>
        </div>
        <FAQAccordion items={FAQ} />
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center space-y-6">
        <h2 className="text-3xl font-display font-bold">Empezá hoy</h2>
        <p className="text-brand-muted text-lg">7 dias gratis, sin tarjeta de credito. Tu negocio merece un sistema que lo entienda.</p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-base shadow-[0_0_30px_rgba(255,107,0,0.4)] hover:shadow-[0_0_50px_rgba(255,107,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Crear cuenta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-brand-muted space-y-2">
        <div>GestiOS · Sistema de gestion para negocios en Bolivia y Latinoamerica</div>
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
          <span className="text-white/20">·</span>
          <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
        </div>
      </footer>
    </div>
  );
}
