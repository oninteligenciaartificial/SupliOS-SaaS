import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { organization: { select: { name: true } } },
  });

  if (!profile) redirect("/setup");

  const isSuperAdmin = profile.role === "SUPERADMIN";

  const superAdminLinks = [
    { href: "/superadmin", label: "Panel Principal" },
    { href: "/superadmin/organizations", label: "Organizaciones" },
    { href: "/superadmin/users", label: "Usuarios" },
  ];

  const tenantLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/inventory", label: "Inventario" },
    { href: "/orders", label: "Pedidos" },
    { href: "/customers", label: "Clientes" },
    { href: "/reports", label: "Reportes" },
    { href: "/suppliers", label: "Proveedores" },
    { href: "/discounts", label: "Descuentos" },
    { href: "/categories", label: "Categorias" },
    ...(profile.role === "ADMIN" ? [{ href: "/staff", label: "Equipo" }] : []),
    { href: "/settings", label: "Configuracion" },
  ];

  const navLinks = isSuperAdmin ? superAdminLinks : tenantLinks;
  const orgName = isSuperAdmin ? "Super Admin" : (profile.organization?.name ?? "");

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-white/5 bg-brand-surface-lowest/50 p-6 flex flex-col gap-8">
        <div>
          <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">
            SupliOS.
          </div>
          <div className={`text-xs mt-1 truncate ${isSuperAdmin ? "text-brand-kinetic-orange/70 font-medium" : "text-brand-muted"}`}>
            {orgName}
          </div>
        </div>

        <SidebarNav links={navLinks} />

        <SidebarUser
          name={profile.name}
          email={user.email ?? ""}
          role={profile.role}
          isSuperAdmin={isSuperAdmin}
        />
      </aside>
      <main className="flex-1 w-full relative overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
