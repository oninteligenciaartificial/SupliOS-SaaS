"use client";

import { useEffect, useState } from "react";
import { Zap, Check, X, MessageCircle } from "lucide-react";
import { ADDON_META } from "@/lib/plans";

const WA_NUMBER = "59175470140";
const ADDON_WA_MSG: Record<string, string> = {
  WHATSAPP:    "Hola! Me interesa activar el add-on *WhatsApp Business* ($40/mes) en GestiOS. ¿Cómo procedo?",
  FACTURACION: "Hola! Me interesa el add-on de *Facturación SIAT* para Bolivia en GestiOS. ¿Cuándo estará disponible?",
  MERCADOPAGO: "Hola! Quiero activar el add-on de *Pagos QR Bolivia* ($15/mes) en GestiOS. ¿Cómo procedo?",
  ECOMMERCE:   "Hola! Me interesa el add-on de *E-commerce* ($20/mes) en GestiOS para conectar mi tienda online. ¿Cómo procedo?",
  CONTABILIDAD:"Hola! Quiero activar la *Exportación Contable* ($18/mes) en GestiOS. ¿Cómo procedo?",
};

type AddonType = "WHATSAPP" | "FACTURACION" | "MERCADOPAGO" | "ECOMMERCE" | "CONTABILIDAD";

interface OrgAddon {
  addon: AddonType;
  active: boolean;
}

const ALL_ADDONS: AddonType[] = ["WHATSAPP", "FACTURACION", "MERCADOPAGO", "ECOMMERCE", "CONTABILIDAD"];

export default function AddonsPage() {
  const [addons, setAddons] = useState<OrgAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  useEffect(() => { fetchAddons(); }, []);

  async function fetchAddons() {
    setLoading(true);
    const res = await fetch("/api/addons");
    if (res.ok) {
      setAddons(await res.json());
      setError(null);
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.upgrade) setUpgradeMsg(body.error);
      else setError(body.error ?? "Error al cargar add-ons");
    }
    setLoading(false);
  }

  function isActive(addon: AddonType): boolean {
    return addons.some(a => a.addon === addon && a.active);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header className="animate-pop">
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">Add-ons</h1>
        <p className="text-brand-muted mt-1 text-sm">Activa funcionalidades adicionales para tu negocio</p>
      </header>

      {upgradeMsg && (
        <div className="glass-panel border border-brand-kinetic-orange/30 rounded-2xl p-4">
          <p className="text-brand-kinetic-orange text-sm font-medium">{upgradeMsg}</p>
          <p className="text-brand-muted text-xs mt-1">Los add-ons están disponibles desde el plan Crecer ($59/mes).</p>
        </div>
      )}

      {error && (
        <div className="glass-panel border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-brand-muted animate-pulse">
          Cargando add-ons...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALL_ADDONS.map((addon) => {
            const meta = ADDON_META[addon];
            const active = isActive(addon);

            return (
              <div
                key={addon}
                className={`glass-panel rounded-2xl p-5 transition-all duration-300 animate-pop ${active ? "border border-brand-kinetic-orange/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? "bg-brand-kinetic-orange/15" : "bg-white/5"}`}>
                      <Zap size={18} className={active ? "text-brand-kinetic-orange" : "text-brand-muted"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{meta.label}</h3>
                        {meta.comingSoon && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 text-[10px] font-bold">Próximamente</span>
                        )}
                      </div>
                      <p className="text-brand-kinetic-orange text-xs font-semibold mt-0.5">{meta.price}</p>
                    </div>
                  </div>

                  {/* Read-only status badge — only superadmin can enable/disable */}
                  <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    meta.comingSoon
                      ? "bg-white/5 text-white/25"
                      : active
                        ? "bg-green-500/15 text-green-400"
                        : "bg-white/5 text-brand-muted"
                  }`}>
                    {meta.comingSoon ? (
                      <><X size={13} /> Pronto</>
                    ) : active ? (
                      <><Check size={13} /> Activo</>
                    ) : (
                      <><X size={13} /> Inactivo</>
                    )}
                  </span>
                </div>

                <p className="text-xs text-brand-muted mt-3 leading-relaxed">{meta.description}</p>

                <button
                  onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ADDON_WA_MSG[addon] ?? "")}`, "_blank")}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                >
                  <MessageCircle size={13} /> {meta.comingSoon ? "Consultar disponibilidad" : active ? "Soporte por WhatsApp" : "Solicitar por WhatsApp"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
