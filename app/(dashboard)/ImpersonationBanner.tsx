"use client";

import { useRouter } from "next/navigation";
import { LogOut, Eye } from "lucide-react";

export function ImpersonationBanner({ orgName }: { orgName: string }) {
  const router = useRouter();

  async function handleExit() {
    await fetch("/api/superadmin/impersonate", { method: "DELETE" });
    router.push("/superadmin/organizations");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 bg-brand-kinetic-orange/20 border-b border-brand-kinetic-orange/40 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 text-sm text-brand-kinetic-orange font-medium">
        <Eye size={15} />
        Viendo como administrador de <span className="font-bold">{orgName}</span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold hover:opacity-90 transition-opacity"
      >
        <LogOut size={13} /> Volver al Superadmin
      </button>
    </div>
  );
}
