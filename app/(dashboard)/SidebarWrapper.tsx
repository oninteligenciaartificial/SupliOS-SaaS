"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";

interface NavLink { href: string; label: string }

interface Props {
  links: NavLink[];
  orgName: string;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  name: string;
  email: string;
  role: string;
}

export function SidebarWrapper({ links, orgName, isSuperAdmin, isImpersonating, name, email, role }: Props) {
  const [open, setOpen] = useState(false);

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
        fixed lg:static inset-y-0 left-0 z-50
        w-64 border-r border-white/5 bg-[#0a0a0a] lg:bg-brand-surface-lowest/50
        p-6 flex flex-col gap-6 lg:gap-8
        transition-transform duration-300 lg:transition-none lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
        overflow-y-auto
      `}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-display font-bold tracking-widest text-brand-kinetic-orange">
              SupliOS.
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

        <SidebarNav links={links} onNavigate={() => setOpen(false)} />

        <SidebarUser name={name} email={email} role={role} isSuperAdmin={isSuperAdmin} />
      </aside>
    </>
  );
}
