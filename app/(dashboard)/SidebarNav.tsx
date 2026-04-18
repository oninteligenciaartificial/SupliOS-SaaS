"use client";

import { usePathname } from "next/navigation";

interface NavLink { href: string; label: string }

export function SidebarNav({ links, onNavigate }: { links: NavLink[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/superadmin") return pathname === "/superadmin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            isActive(link.href)
              ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange border border-brand-kinetic-orange/30"
              : "text-brand-muted hover:bg-white/5 hover:text-white"
          }`}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
