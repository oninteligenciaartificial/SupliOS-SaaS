import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, ShoppingCart, AlertTriangle, DollarSign, MessageSquare, Plus, RefreshCcw, PackageSearch } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/setup");
  if (profile.role === "SUPERADMIN") redirect("/superadmin");
  if (!profile.organizationId) redirect("/setup");

  const orgId = profile.organizationId;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalProducts, allProducts, weeklyOrders, monthlyOrders] = await Promise.all([
    prisma.product.count({ where: { organizationId: orgId, active: true } }),
    prisma.product.findMany({
      where: { organizationId: orgId, active: true },
      select: { id: true, name: true, stock: true, minStock: true },
      orderBy: { stock: "asc" },
    }),
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: weekAgo } } }),
    prisma.order.findMany({
      where: { organizationId: orgId, createdAt: { gte: monthStart }, status: { not: "CANCELADO" } },
      select: { total: true },
    }),
  ]);

  const monthlyRevenue = monthlyOrders.reduce((sum: number, o) => sum + Number(o.total), 0);
  const lowStockAlerts = allProducts.filter((p) => p.stock <= p.minStock).slice(0, 5);

  const kpis = [
    { title: "Inventario Total",  value: String(totalProducts),           label: "SKUs Activos",    icon: Package,       color: "text-brand-kinetic-orange" },
    { title: "Pedidos Semana",    value: String(weeklyOrders),             label: "Ultimos 7 dias",  icon: ShoppingCart,  color: "text-white"                },
    { title: "Alertas Stock",     value: String(lowStockAlerts.length),    label: "Reabastecer Ya",  icon: AlertTriangle, color: "text-red-400"              },
    { title: "Ingresos",          value: `$${monthlyRevenue.toLocaleString("es-MX")}`, label: "Mensual", icon: DollarSign, color: "text-brand-growth-neon" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-brand-muted mt-1">Vision general del inventario y pedidos</p>
        </div>
        <div className="flex gap-4">
          <button className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 hover:bg-brand-surface-highest/80 transition-colors">
            <RefreshCcw size={18} className="text-brand-kinetic-orange" />
            <span>Sincronizar</span>
          </button>
          <a href="/orders/new" className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all">
            <Plus size={18} />
            <span>Nuevo Pedido</span>
          </a>
        </div>
      </header>

      <section className="kpi-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass-panel p-6 rounded-2xl animate-pop hover:-translate-y-2 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-brand-muted font-medium">{kpi.title}</h3>
              <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="text-4xl font-display font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-sm text-brand-muted/70">{kpi.label}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  Todo el inventario esta en buen nivel
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
          <h2 className="text-2xl font-display font-bold text-white">Soporte</h2>
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <MessageSquare className="text-brand-growth-neon" size={24} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-kinetic-orange rounded-full animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-white">Bot Activado</div>
                <div className="text-sm text-brand-muted">Autorespuestas On</div>
              </div>
            </div>
            <div className="text-center py-6 text-brand-muted text-sm">
              Integracion WhatsApp proximamente
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
