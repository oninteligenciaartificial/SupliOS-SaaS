import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarWrapper } from "./SidebarWrapper";
import { ImpersonationBanner } from "./ImpersonationBanner";

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

  const cookieStore = await cookies();
  const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
  const impersonateOrgName = cookieStore.get("impersonate_org_name")?.value;

  const isImpersonating = profile.role === "SUPERADMIN" && !!impersonateOrgId;
  const isSuperAdmin = profile.role === "SUPERADMIN" && !isImpersonating;

  const superAdminLinks = [
    { href: "/superadmin", label: "Panel Principal" },
    { href: "/superadmin/organizations", label: "Organizaciones" },
    { href: "/superadmin/users", label: "Usuarios" },
  ];

  const tenantLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/pos", label: "Punto de Venta" },
    { href: "/inventory", label: "Inventario" },
    { href: "/orders", label: "Pedidos" },
    { href: "/customers", label: "Clientes" },
    { href: "/reports", label: "Reportes" },
    { href: "/suppliers", label: "Proveedores" },
    { href: "/discounts", label: "Descuentos" },
    { href: "/categories", label: "Categorias" },
    ...(!isImpersonating && profile.role === "ADMIN" ? [{ href: "/staff", label: "Equipo" }] : []),
    ...(isImpersonating ? [] : [{ href: "/settings", label: "Configuracion" }]),
  ];

  const navLinks = isSuperAdmin ? superAdminLinks : tenantLinks;

  let orgDisplayName: string;
  if (isSuperAdmin) {
    orgDisplayName = "Super Admin";
  } else if (isImpersonating) {
    orgDisplayName = impersonateOrgName ?? "Tienda";
  } else {
    orgDisplayName = profile.organization?.name ?? "";
  }

  return (
    <div className="flex min-h-screen">
      <SidebarWrapper
        links={navLinks}
        orgName={orgDisplayName}
        isSuperAdmin={isSuperAdmin}
        isImpersonating={isImpersonating}
        name={profile.name}
        email={user.email ?? ""}
        role={profile.role}
      />
      <main className="flex-1 w-full relative overflow-y-auto lg:overflow-y-auto">
        {isImpersonating && impersonateOrgName && (
          <ImpersonationBanner orgName={impersonateOrgName} />
        )}
        {/* Padding top on mobile to avoid hamburger overlap */}
        <div className="pt-16 lg:pt-0 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
