export type PlanType = "BASICO" | "CRECER" | "PRO" | "EMPRESARIAL";

export const PLAN_PRICES_BOB: Record<PlanType, number> = {
  BASICO: 350,
  CRECER: 530,
  PRO: 800,
  EMPRESARIAL: 1250,
};
export type AddonType = "WHATSAPP" | "FACTURACION" | "MERCADOPAGO" | "ECOMMERCE" | "CONTABILIDAD";

export const PLAN_META: Record<PlanType, { label: string; price: string; color: string; bg: string }> = {
  BASICO:      { label: "Básico",      price: "$39/mes",  color: "text-brand-muted",          bg: "bg-white/5" },
  CRECER:      { label: "Crecer",      price: "$59/mes",  color: "text-blue-300",              bg: "bg-blue-400/10" },
  PRO:         { label: "Pro",         price: "$89/mes",  color: "text-blue-400",              bg: "bg-blue-500/10" },
  EMPRESARIAL: { label: "Empresarial", price: "$139/mes", color: "text-brand-kinetic-orange",  bg: "bg-brand-kinetic-orange/10" },
};

export const PLAN_LIMITS: Record<PlanType, { maxProducts: number; maxCustomers: number; maxStaff: number; maxDiscounts: number }> = {
  BASICO:      { maxProducts: 150,      maxCustomers: 50,       maxStaff: 1,        maxDiscounts: 3 },
  CRECER:      { maxProducts: 500,      maxCustomers: 300,      maxStaff: 3,        maxDiscounts: Infinity },
  PRO:         { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: 10,       maxDiscounts: Infinity },
  EMPRESARIAL: { maxProducts: Infinity, maxCustomers: Infinity, maxStaff: Infinity, maxDiscounts: Infinity },
};

export const ADDON_META: Record<AddonType, { label: string; price: string; description: string; comingSoon?: boolean }> = {
  WHATSAPP:    { label: "WhatsApp Business",    price: "$40/mes", description: "300 conversaciones incluidas, excedente $0.08 c/u",                                comingSoon: true },
  FACTURACION: { label: "Facturación SIAT",    price: "$25/mes", description: "Facturas electrónicas oficiales según el SIN Bolivia",                              comingSoon: true },
  MERCADOPAGO: { label: "Pagos QR Bolivia",    price: "$15/mes", description: "Acepta pagos con QR bancario, Tigo Money y BiPago",                                 comingSoon: true },
  ECOMMERCE:   { label: "E-commerce",          price: "$20/mes", description: "Conecta tu tienda online y sincroniza inventario automáticamente",                   comingSoon: true },
  CONTABILIDAD: { label: "Exportación Contable", price: "$18/mes", description: "Exporta ventas y gastos en CSV/Excel para tu contador",                           comingSoon: true },
};

const PLAN_ORDER: Record<PlanType, number> = { BASICO: 0, CRECER: 1, PRO: 2, EMPRESARIAL: 3 };

export function isPlanAtLeast(plan: PlanType, required: PlanType): boolean {
  return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}

// Minimum plan required per feature. Features not listed are available to all plans.
export const FEATURE_PLAN: Record<string, PlanType> = {
  reports:          "CRECER",
  suppliers:        "CRECER",
  csv_import:       "CRECER",
  csv_export:       "CRECER",
  registro_publico: "PRO",
  email_basic:      "PRO",
  email_advanced:   "EMPRESARIAL",
  sucursales:       "EMPRESARIAL",
  roles_avanzados:  "EMPRESARIAL",
  audit_log:        "EMPRESARIAL",
};

export function canUseFeature(plan: PlanType, feature: string): boolean {
  const required = FEATURE_PLAN[feature];
  if (!required) return true;
  return isPlanAtLeast(plan, required);
}

export function canUseAddon(activeAddons: AddonType[], addon: AddonType): boolean {
  return activeAddons.includes(addon);
}

export function planGateError(feature: string): { error: string; upgrade: true; requiredPlan: PlanType } {
  const required = FEATURE_PLAN[feature] ?? "CRECER";
  const label = PLAN_META[required].label;
  return { error: `Esta función requiere el plan ${label} o superior.`, upgrade: true, requiredPlan: required };
}

export function limitGateError(resource: string, limit: number, plan: PlanType): { error: string; upgrade: true; limit: number } {
  const label = PLAN_META[plan].label;
  return {
    error: `Tu plan ${label} permite hasta ${limit} ${resource}. Actualiza para continuar.`,
    upgrade: true,
    limit,
  };
}
