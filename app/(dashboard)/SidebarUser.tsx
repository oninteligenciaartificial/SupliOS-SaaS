"use client";

import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

export function SidebarUser({ name, email, role, isSuperAdmin }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mt-auto space-y-1">
      <div className="px-4 py-3 rounded-xl border border-white/10 text-sm">
        <div className="font-medium text-white truncate">{name}</div>
        <div className="text-xs text-brand-muted truncate">{email}</div>
        <div className={`text-xs mt-0.5 font-bold ${isSuperAdmin ? "text-brand-kinetic-orange" : "text-brand-muted/60"}`}>
          {role}
        </div>
      </div>
      <a
        href="/settings"
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-brand-muted hover:bg-white/5 hover:text-white transition-colors"
      >
        <Settings size={14} />
        Configuracion
      </a>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={14} />
        Cerrar Sesion
      </button>
    </div>
  );
}
