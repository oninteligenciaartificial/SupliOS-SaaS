"use client";

import { useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";
import { PLAN_META, type PlanType } from "@/lib/plans";

interface NavLink { href: string; label: string; external?: boolean }

interface Props {
  links: NavLink[];
  lockedHrefs: string[];
  orgName: string;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  name: string;
  email: string;
  role: string;
  plan: PlanType | null;
  planExpiresAt: string | null;
}

export function SidebarWrapper({ links, lockedHrefs, orgName, isSuperAdmin, isImpersonating, name, email, role, plan, planExpiresAt }: Props) {
  const [open, setOpen] = useState(false);

  const planMeta = plan ? PLAN_META[plan] : null;

  const daysLeft = planExpiresAt
    ? Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const showExpiryAlert = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  const internalLinks = links.filter(l => !l.external);
  const externalLinks = links.filter(l => l.external);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-white shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        w-64 h-screen border-r border-white/5 bg-[#0a0a0a] lg:bg-brand-surface-lowest/50
        p-6 flex flex-col gap-6 lg:gap-8
        transition-transform duration-300 lg:transition-none lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
        overflow-y-auto flex-shrink-0
      `}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">
              GestiOS.
            </div>
            <div className={`text-xs mt-1 truncate ${
              isSuperAdmin
                ? "text-brand-kinetic-orange/70 font-medium"
                : isImpersonating
                ? "text-yellow-400/70"
                : "text-brand-muted"
            }`}>
              {orgName}
            </div>
          </div>
          <button
            className="lg:hidden text-brand-muted hover:text-white transition-colors mt-1"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav links={internalLinks} lockedHrefs={lockedHrefs} onNavigate={() => setOpen(false)} />

        {externalLinks.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-brand-muted hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ExternalLink size={13} className="text-brand-muted flex-shrink-0" />
              </a>
            ))}
          </div>
        )}

        {planMeta && (
          <div className="space-y-2">
            <div className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${planMeta.bg} border border-white/5`}>
              <span className={planMeta.color}>{planMeta.label}</span>
              <span className="text-brand-muted">{planMeta.price}</span>
            </div>
            {showExpiryAlert && (
              <div className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">
                ⚠ Plan vence en {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
              </div>
            )}
            {daysLeft !== null && daysLeft > 7 && daysLeft <= 30 && (
              <div className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                Vence en {daysLeft} dias
              </div>
            )}
          </div>
        )}

        <SidebarUser name={name} email={email} role={role} isSuperAdmin={isSuperAdmin} />
      </aside>
    </>
  );
}
