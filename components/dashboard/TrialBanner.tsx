"use client";

import Link from "next/link";
import { isInTrial, trialDaysLeft } from "@/lib/plans";

interface TrialBannerProps {
  trialEndsAt: string | null;
}

export function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  const date = trialEndsAt ? new Date(trialEndsAt) : null;
  const active = isInTrial(date);
  const expired = !active && date !== null;

  if (!active && !expired) return null;

  if (active) {
    const days = trialDaysLeft(date);
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-yellow-900/20 border-yellow-500/30 text-yellow-200 text-sm">
        <span>
          Prueba gratuita: <strong>{days} {days === 1 ? "día" : "días"} restantes</strong>.
        </span>
        <Link
          href="/billing"
          className="shrink-0 font-medium underline underline-offset-2 hover:text-yellow-100 transition-colors"
        >
          Actualiza tu plan →
        </Link>
      </div>
    );
  }

  // Trial expired
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-red-900/20 border-red-500/30 text-red-200 text-sm">
      <span>Tu prueba ha finalizado. Elige un plan para continuar.</span>
      <Link
        href="/billing"
        className="shrink-0 font-medium underline underline-offset-2 hover:text-red-100 transition-colors"
      >
        Ver planes →
      </Link>
    </div>
  );
}
