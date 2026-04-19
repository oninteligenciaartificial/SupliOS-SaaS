import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, Users, ShoppingCart, Package, TrendingUp, Plus } from "lucide-react";

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") redirect("/");

  const totalOrgs = await prisma.organization.count();
  const totalUsers = await prisma.profile.count({ where: { role: { not: "SUPERADMIN" } } });
  const totalOrders = await prisma.order.count();
  const totalProducts = await prisma.product.count({ where: { active: true } });
  const monthlyRevenue = await prisma.order.findMany({
    where: {
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      status: { not: "CANCELADO" },
    },
    select: { total: true },
  });

  const revenue = monthlyRevenue.reduce((s: number, o: { total: unknown }) => s + Number(o.total), 0);

  type OrgWithCount = {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    _count: { profiles: number; products: number; orders: number };
  };

  const recentOrgs: OrgWithCount[] = await prisma.organization.findMany({
    include: {
      _count: { select: { profiles: true, products: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const kpis = [
    { label: "Tiendas activas", value: String(totalOrgs), icon: Building2, color: "text-brand-kinetic-orange" },
    { label: "Usuarios en plataforma", value: String(totalUsers), icon: Users, color: "text-white" },
    { label: "Pedidos totales", value: String(totalOrders), icon: ShoppingCart, color: "text-brand-growth-neon" },
    { label: "Productos activos", value: String(totalProducts), icon: Package, color: "text-white" },
    { label: "Ingresos del mes", value: `$${revenue.toLocaleString("es-MX")}`, icon: TrendingUp, color: "text-brand-kinetic-orange" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-wrap justify-between items-start gap-3 animate-pop">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Panel de Control</h1>
          <p className="text-brand-muted mt-1 text-sm">Vision global de todas las tiendas en GestiOS</p>
        </div>
        <a
          href="/superadmin/organizations"
          className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all text-sm sm:text-base flex-shrink-0"
        >
          <Plus size={16} /> <span className="hidden xs:inline">Nueva </span>Tienda
        </a>
      </header>

      <section className="kpi-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-panel p-4 sm:p-5 rounded-2xl animate-pop hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-brand-muted text-xs font-medium leading-tight">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg bg-white/5 ${kpi.color} flex-shrink-0`}>
                <kpi.icon size={14} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-4 animate-pop">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-white">Tiendas <span className="text-brand-kinetic-orange ml-2">•</span></h2>
          <a href="/superadmin/organizations" className="text-brand-kinetic-orange text-sm font-bold hover:underline">Ver todas</a>
        </div>

        {/* Desktop: tabla */}
        <div className="glass-panel rounded-3xl overflow-hidden hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium text-sm">Tienda</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Usuarios</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Productos</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Pedidos</th>
                <th className="p-5 text-brand-muted font-medium text-sm">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{org.name}</div>
                    <div className="text-xs text-brand-muted font-mono mt-0.5">{org.slug}</div>
                  </td>
                  <td className="p-5 text-white font-display">{org._count.profiles}</td>
                  <td className="p-5 text-white font-display">{org._count.products}</td>
                  <td className="p-5 text-white font-display">{org._count.orders}</td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(org.createdAt).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {recentOrgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-brand-muted">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay tiendas. Crea la primera con el boton de arriba.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: tarjetas */}
        <div className="md:hidden space-y-3">
          {recentOrgs.length === 0 ? (
            <div className="py-12 text-center text-brand-muted">
              <Building2 size={36} className="mx-auto mb-3 opacity-30" />
              <p>No hay tiendas.</p>
            </div>
          ) : recentOrgs.map((org) => (
            <div key={org.id} className="glass-panel rounded-2xl p-4 space-y-3">
              <div>
                <div className="font-bold text-white">{org.name}</div>
                <div className="text-xs text-brand-muted font-mono">{org.slug}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-xl py-2">
                  <div className="text-xs text-brand-muted mb-0.5">Usuarios</div>
                  <div className="font-bold text-white text-lg">{org._count.profiles}</div>
                </div>
                <div className="bg-white/5 rounded-xl py-2">
                  <div className="text-xs text-brand-muted mb-0.5">Productos</div>
                  <div className="font-bold text-white text-lg">{org._count.products}</div>
                </div>
                <div className="bg-white/5 rounded-xl py-2">
                  <div className="text-xs text-brand-muted mb-0.5">Pedidos</div>
                  <div className="font-bold text-white text-lg">{org._count.orders}</div>
                </div>
              </div>
              <div className="text-xs text-brand-muted">{new Date(org.createdAt).toLocaleDateString("es-MX")}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
