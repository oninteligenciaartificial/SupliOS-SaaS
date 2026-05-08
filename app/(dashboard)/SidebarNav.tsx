"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { FEATURE_PLAN, PLAN_META, type PlanType } from "@/lib/plans";

interface NavLink { href: string; label: string }

interface Props {
  links: NavLink[];
  lockedHrefs: string[];
  onNavigate?: () => void;
  lockedPlanMap?: Record<string, PlanType>;
}

const hrefFeatureMap: Record<string, string> = {
  "/reports": "reports",
  "/suppliers": "suppliers",
  "/branches": "sucursales",
};

export function SidebarNav({ links, lockedHrefs, onNavigate, lockedPlanMap }: Props) {
  const pathname = usePathname();
  const [criticalStock, setCriticalStock] = useState(0);
  const lockedSet = new Set(lockedHrefs);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.ok ? r.json() : { data: [] })
      .then((res: { data?: { stock: number; minStock: number }[] } | { stock: number; minStock: number }[]) => {
        const products = Array.isArray(res) ? res : (res.data ?? []);
        setCriticalStock(products.filter(p => p.stock <= p.minStock).length);
      })
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/superadmin") return pathname === "/superadmin";
    return pathname.startsWith(href);
  }

  function getRequiredPlanLabel(href: string): string {
    if (lockedPlanMap?.[href]) return PLAN_META[lockedPlanMap[href]].label;
    const feature = hrefFeatureMap[href];
    if (feature && FEATURE_PLAN[feature]) return PLAN_META[FEATURE_PLAN[feature]].label;
    return "";
  }

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {links.map((link) => {
        const locked = lockedSet.has(link.href);

        if (locked) {
          const requiredPlan = getRequiredPlanLabel(link.href);
          return (
            <div
              key={link.href}
              title={requiredPlan ? `Requiere plan ${requiredPlan}` : "Actualiza tu plan para usar esta funcion"}
              className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between opacity-40 cursor-not-allowed select-none"
            >
              <span className="text-brand-muted">{link.label}</span>
              <Lock size={13} className="text-brand-muted flex-shrink-0" />
            </div>
          );
        }

        return (
          <a
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
              isActive(link.href)
                ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange border border-brand-kinetic-orange/30"
                : "text-brand-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{link.label}</span>
            {link.href === "/inventory" && criticalStock > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {criticalStock > 9 ? "9+" : criticalStock}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
