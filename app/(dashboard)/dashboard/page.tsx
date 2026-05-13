import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingCart, AlertTriangle, DollarSign, Mail, Plus, RefreshCcw, PackageSearch, Sparkles, ArrowRight } from "lucide-react";
import { StockAlertButton } from "../StockAlertButton";

export default async function Dashboard() {
  const profile = await getTenantProfile();
  if (!profile) {
    // If a SUPERADMIN lands here without impersonating an org, send them
    // to the superadmin panel instead of bouncing them to /login (loop).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const raw = await prisma.profile.findUnique({ where: { userId: user.id } });
      if (raw?.role === "SUPERADMIN") redirect("/superadmin");
      if (!raw) redirect("/setup");
    }
    redirect("/login");
  }

  const orgId = profile.organizationId as string;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  type StockItem = { id: string; name: string; stock: number; minStock: number };
  type OrderTotal = { total: { toString(): string } };

  const totalProducts = await prisma.product.count({ where: { organizationId: orgId, active: true } });
  const totalCustomers = await prisma.customer.count({ where: { organizationId: orgId } });
  const allProducts: StockItem[] = await prisma.product.findMany({
    where: { organizationId: orgId, active: true },
    select: { id: true, name: true, stock: true, minStock: true },
    orderBy: { stock: "asc" },
  });
  const weeklyOrders = await prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: weekAgo } } });
  const monthlyOrders: OrderTotal[] = await prisma.order.findMany({
    where: { organizationId: orgId, createdAt: { gte: monthStart }, status: { not: "CANCELADO" } },
    select: { total: true },
  });

  const monthlyRevenue = monthlyOrders.reduce((sum: number, o: OrderTotal) => sum + Number(o.total), 0);
  const lowStockAlerts = allProducts.filter((p: StockItem) => p.stock <= p.minStock).slice(0, 5);

  const isEmpty = totalProducts === 0 && totalCustomers === 0;

  const kpis = [
    { title: "Inventario Total",  value: String(totalProducts),                  label: "SKUs Activos",    icon: Package,       color: "text-brand-kinetic-orange" },
    { title: "Pedidos Semana",    value: String(weeklyOrders),                    label: "Ultimos 7 dias",  icon: ShoppingCart,  color: "text-white"                },
    { title: "Alertas Stock",     value: String(lowStockAlerts.length),           label: "Reabastecer Ya",  icon: AlertTriangle, color: "text-red-400"              },
    { title: "Ingresos",          value: `Bs. ${monthlyRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, label: "Mensual", icon: DollarSign, color: "text-brand-growth-neon" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-wrap justify-between items-start gap-3 animate-pop">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-brand-muted mt-1 text-sm">Vision general de tu tienda</p>
        </div>
        <div className="flex gap-2 sm:gap-4 flex-shrink-0">
          <button className="glass-panel px-3 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 hover:bg-brand-surface-highest/80 transition-colors text-sm">
            <RefreshCcw size={16} className="text-brand-kinetic-orange" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <a href="/orders" className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all text-sm sm:text-base">
            <Plus size={16} />
            <span>Pedido</span>
          </a>
        </div>
      </header>

      {/* Onboarding card for empty accounts */}
      {isEmpty && (
        <section className="glass-panel rounded-3xl p-6 sm:p-8 border-brand-kinetic-orange/20 animate-pop">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-brand-kinetic-orange/15 flex-shrink-0">
              <Sparkles size={24} className="text-brand-kinetic-orange" />
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-bold text-white">Bienvenido a GestiOS!</h2>
              <p className="text-brand-muted text-sm leading-relaxed">
                Tu cuenta esta lista. Para explorar todas las funciones, puedes cargar datos de ejemplo
                (productos, clientes, pedidos) o empezar desde cero.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  id="load-sample-data"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
                >
                  <Sparkles size={14} /> Cargar datos de ejemplo
                </button>
                <a
                  href="/inventory"
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold flex items-center gap-2 hover:border-white/30 transition-colors"
                >
                  Empezar desde cero <ArrowRight size={14} />
                </a>
              </div>
              <p className="text-xs text-brand-muted">
                Los datos de ejemplo incluyen 5 productos, 5 clientes, 3 descuentos y 5 pedidos.
                Puedes eliminarlos despues desde Configuración.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass-panel p-4 sm:p-6 rounded-2xl animate-pop hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-brand-muted font-medium text-xs sm:text-sm">{kpi.title}</h3>
              <div className={`p-1.5 sm:p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                <kpi.icon size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-display font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-xs sm:text-sm text-brand-muted/70">{kpi.label}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold text-white animate-pop">
            Alertas de Stock <span className="text-brand-kinetic-orange ml-2">•</span>
          </h2>
          <div className="glass-panel rounded-3xl overflow-hidden animate-pop">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-medium text-brand-muted">Productos con stock bajo</h3>
              <a href="/inventory" className="text-brand-kinetic-orange text-sm font-bold flex items-center gap-1 hover:underline">
                <PackageSearch size={16} /> Ver Todo
              </a>
            </div>
            <div className="divide-y divide-white/5">
              {lowStockAlerts.length === 0 && (
                <div className="py-8 px-6 text-center text-brand-muted">
                  {isEmpty ? "Carga datos de ejemplo para ver alertas de stock" : "Todo el inventario esta en buen nivel"}
                </div>
              )}
              {lowStockAlerts.map((item) => (
                <div key={item.id} className="py-4 px-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-brand-muted mt-1">
                      Quedan {item.stock} unidades
                      {item.stock <= item.minStock && (
                        <span className="ml-2 text-red-400 font-medium">Critico</span>
                      )}
                    </div>
                  </div>
                  <a href="/inventory" className="px-4 py-2 rounded-lg border border-white/10 hover:border-brand-kinetic-orange hover:text-brand-kinetic-orange transition-colors">
                    Reabastecer
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-pop">
          <h2 className="text-2xl font-display font-bold text-white">Notificaciones</h2>
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-growth-neon/10">
                <Mail size={20} className="text-brand-growth-neon" />
              </div>
              <div>
                <div className="font-bold text-white">Alertas por Email</div>
                <div className="text-sm text-brand-muted">Recibe avisos en tu correo</div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-brand-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-growth-neon flex-shrink-0" />
                Confirmacion automatica al crear pedido
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h.5 rounded-full bg-brand-growth-neon flex-shrink-0" />
                Actualizacion de estado al cliente
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-kinetic-orange flex-shrink-0" />
                Alerta de stock bajo al admin
              </div>
            </div>
            {lowStockAlerts.length > 0 && (
              <StockAlertButton count={lowStockAlerts.length} />
            )}
          </div>
        </section>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('load-sample-data')?.addEventListener('click', async function() {
          this.textContent = 'Cargando...';
          this.disabled = true;
          try {
            const res = await fetch('/api/sample-data', { method: 'POST' });
            if (res.ok) {
              window.location.reload();
            } else {
              this.textContent = 'Error al cargar datos';
              this.disabled = false;
            }
          } catch {
            this.textContent = 'Error al cargar datos';
            this.disabled = false;
          }
        });
      `}} />
    </div>
  );
}
