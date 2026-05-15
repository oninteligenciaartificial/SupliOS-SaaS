import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarWrapper } from "./SidebarWrapper";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { canUseFeature, isPlanAtLeast, FEATURE_PLAN, type PlanType } from "@/lib/plans";
import { getBusinessUI, type BusinessUIConfig } from "@/lib/business-ui";
import type { BusinessType } from "@/lib/business-types";

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
    include: {
      organization: {
        select: {
          name: true,
          plan: true,
          planExpiresAt: true,
          trialEndsAt: true,
          businessType: true,
          addons: { select: { addon: true, active: true } },
        },
      },
    },
  });

  if (!profile) redirect("/setup");

  // Check plan expiry — redirect non-superadmins with expired plans
  // /plan-vencido lives outside this layout group so no infinite loop
  if (profile.role !== "SUPERADMIN") {
    const now = new Date();
    const planExpired = profile.organization?.planExpiresAt && profile.organization.planExpiresAt < now;
    const trialActive = profile.organization?.trialEndsAt && profile.organization.trialEndsAt > now;
    if (planExpired && !trialActive) {
      redirect("/plan-vencido");
    }
  }

  const cookieStore = await cookies();
  const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
  const impersonateOrgName = cookieStore.get("impersonate_org_name")?.value;

  const isImpersonating = profile.role === "SUPERADMIN" && !!impersonateOrgId;
  const isSuperAdmin = profile.role === "SUPERADMIN" && !isImpersonating;

  // Resolve the active plan (impersonating superadmin gets impersonated org's plan)
  let activePlan: PlanType = (profile.organization?.plan ?? "BASICO") as PlanType;
  let activeAddons = profile.organization?.addons ?? [];

  if (isImpersonating && impersonateOrgId) {
    const impersonatedOrg = await prisma.organization.findUnique({
      where: { id: impersonateOrgId },
      select: { plan: true, addons: { select: { addon: true, active: true } } },
    });
    activePlan = (impersonatedOrg?.plan ?? "BASICO") as PlanType;
    activeAddons = impersonatedOrg?.addons ?? [];
  }

  const hasWhatsApp = activeAddons.some(a => a.addon === "WHATSAPP" && a.active);

  const superAdminLinks = [
    { href: "/superadmin", label: "Panel Principal" },
    { href: "/superadmin/organizations", label: "Organizaciones" },
    { href: "/superadmin/users", label: "Usuarios" },
    { href: "/superadmin/payments", label: "Pagos y Planes" },
  ];

  const externalLinks = [
    { href: "https://gesti-os.vercel.app", label: "Ver Landing", external: true },
  ];

  // Map feature keys to nav hrefs for lock detection
  const featureHrefMap: Record<string, string> = {
    reports: "/reports",
    suppliers: "/suppliers",
    sucursales: "/branches",
  };
  const lockedHrefs = new Set(
    Object.entries(featureHrefMap)
      .filter(([feature]) => !canUseFeature(activePlan, feature))
      .map(([, href]) => href)
  );

  const showBranches = canUseFeature(activePlan, "sucursales");

  // Resolve business type for dynamic sidebar labels
  const businessType = (profile.organization?.businessType ?? "GENERAL") as BusinessType;
  const ui: BusinessUIConfig = getBusinessUI(businessType);

  const tenantLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pos", label: "Punto de Venta" },
    { href: "/ventas", label: "Ventas" },
    { href: "/inventory", label: ui.sidebarLabels.inventory },
    { href: "/orders", label: "Pedidos" },
    { href: "/customers", label: "Clientes" },
    { href: "/reports", label: "Reportes" },
    { href: "/caja", label: "Corte de Caja" },
    { href: "/suppliers", label: ui.sidebarLabels.suppliers },
    { href: "/discounts", label: "Descuentos" },
    { href: "/categories", label: ui.sidebarLabels.categories },
    ...(showBranches ? [{ href: "/branches", label: "Sucursales" }] : []),
    ...(hasWhatsApp ? [{ href: "/conversations", label: "WhatsApp" }] : []),
    ...(!isImpersonating && (profile.role === "ADMIN" || profile.role === "MANAGER") ? [{ href: "/staff", label: "Equipo" }] : []),
    ...(!isImpersonating ? ui.extraSections
      .filter(s => !s.minPlan || isPlanAtLeast(activePlan, s.minPlan as PlanType))
      .map(s => ({ href: s.href, label: s.label }))
    : []),
    ...(!isImpersonating ? [{ href: "/settings", label: "Configuracion" }] : []),
    ...(!isImpersonating ? [{ href: "/help", label: "Ayuda" }] : []),
  ];

  const navLinks = isSuperAdmin ? [...superAdminLinks, ...externalLinks] : tenantLinks;

  let orgDisplayName: string;
  if (isSuperAdmin) {
    orgDisplayName = "Super Admin";
  } else if (isImpersonating) {
    orgDisplayName = impersonateOrgName ?? "Tienda";
  } else {
    orgDisplayName = profile.organization?.name ?? "";
  }

  const lockedPlanMap: Record<string, PlanType> = isSuperAdmin ? {} : Object.fromEntries(
    Object.entries(featureHrefMap)
      .filter(([feature]) => !canUseFeature(activePlan, feature))
      .map(([feature, href]) => [href, FEATURE_PLAN[feature]])
  ) as Record<string, PlanType>;

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWrapper
        links={navLinks}
        lockedHrefs={isSuperAdmin ? [] : [...lockedHrefs]}
        orgName={orgDisplayName}
        isSuperAdmin={isSuperAdmin}
        isImpersonating={isImpersonating}
        name={profile.name}
        email={user.email ?? ""}
        role={profile.role}
        plan={isSuperAdmin ? null : activePlan}
        planExpiresAt={isSuperAdmin ? null : (profile.organization?.planExpiresAt?.toISOString() ?? null)}
        lockedPlanMap={lockedPlanMap}
      />
      <main className="flex-1 w-full overflow-y-auto">
        {isImpersonating && impersonateOrgName && (
          <ImpersonationBanner orgName={impersonateOrgName} />
        )}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
