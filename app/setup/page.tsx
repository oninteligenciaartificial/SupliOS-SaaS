"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Pill, ShoppingBag, Wrench, Zap, Store } from "lucide-react";
import type { BusinessType } from "@/lib/business-types";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS, BUSINESS_TYPE_SCHEMAS } from "@/lib/business-types";

const BUSINESS_ICONS: Record<BusinessType, React.ReactNode> = {
  GENERAL:     <Store size={28} />,
  ROPA:        <Shirt size={28} />,
  SUPLEMENTOS: <ShoppingBag size={28} />,
  ELECTRONICA: <Zap size={28} />,
  FARMACIA:    <Pill size={28} />,
  FERRETERIA:  <Wrench size={28} />,
};

const BUSINESS_DESCRIPTIONS: Record<BusinessType, string> = {
  GENERAL:     "Productos variados sin variantes especiales.",
  ROPA:        "Tallas (XS-XXL) y colores para cada prenda.",
  SUPLEMENTOS: "Sabores y pesos para suplementos deportivos.",
  ELECTRONICA: "Capacidad y color para dispositivos y accesorios.",
  FARMACIA:    "Presentaciones y dosis para medicamentos.",
  FERRETERIA:  "Medidas y materiales para herramientas.",
};

const VARIANT_LABELS: Record<string, string> = {
  talla: "Tallas",
  color: "Colores",
  sabor: "Sabores",
  peso: "Pesos",
  capacidad: "Capacidades",
  presentacion: "Presentaciones",
  dosis: "Dosis",
  medida: "Medidas",
  material: "Materiales",
};

function getVariantFields(type: BusinessType): string[] {
  const schema = BUSINESS_TYPE_SCHEMAS[type];
  return Object.entries(schema).map(([key, values]) => {
    const label = VARIANT_LABELS[key] ?? key;
    const valuesHint = values.length > 0 ? values.slice(0, 3).join(", ") + (values.length > 3 ? "..." : "") : "libre";
    return `${label}: ${valuesHint}`;
  });
}

const inp = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [userName, setUserName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationName: orgName, userName, businessType }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Ocurrio un error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface-lowest p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="text-3xl font-display font-bold tracking-widest text-brand-kinetic-orange mb-2">
            GestiOS.
          </div>
          <h1 className="text-2xl font-bold text-white">Configura tu tienda</h1>
          <p className="text-brand-muted mt-2">Solo necesitas hacer esto una vez.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-5 animate-pop">
            <h2 className="text-lg font-bold text-white">Datos basicos</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-muted">Nombre de la tienda</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className={inp}
                placeholder="Ej: Mi Tienda"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-muted">Tu nombre</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className={inp}
                placeholder="Ej: Daniela"
              />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4 animate-pop">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Que tipo de negocio tienes?</h2>
              <p className="text-sm text-brand-muted">Esto define comoGestionas tus productos e inventario.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => {
                const selected = businessType === type;
                const variantFields = getVariantFields(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    className={`relative text-left p-4 rounded-2xl border transition-all duration-200 ${
                      selected
                        ? "border-brand-kinetic-orange bg-brand-kinetic-orange/10"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-kinetic-orange flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`mb-3 ${selected ? "text-brand-kinetic-orange" : "text-brand-muted"}`}>
                      {BUSINESS_ICONS[type]}
                    </div>
                    <div className="font-bold text-white text-sm mb-1">{BUSINESS_TYPE_LABELS[type]}</div>
                    <div className="text-xs text-brand-muted mb-3 leading-relaxed">
                      {BUSINESS_DESCRIPTIONS[type]}
                    </div>
                    {variantFields.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {variantFields.map((vf) => (
                          <span key={vf} className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-xs text-brand-muted">
                            {vf}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear mi cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
