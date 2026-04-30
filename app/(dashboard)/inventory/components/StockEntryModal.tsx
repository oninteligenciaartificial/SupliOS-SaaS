"use client";

import { X } from "lucide-react";
import type { Product } from "./types";

interface Props {
  product: Product;
  qty: string;
  saving: boolean;
  onQtyChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function StockEntryModal({ product, qty, saving, onQtyChange, onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Entrada de Stock</h2>
            <p className="text-xs text-brand-muted mt-0.5 truncate">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4 rounded-xl bg-white/5 text-center">
          <div className="text-brand-muted text-xs mb-1">Stock actual</div>
          <div className="text-3xl font-display font-bold text-white">{product.stock}</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-brand-muted">Cantidad a ingresar *</label>
            <input
              required type="number" min="1" value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-bold text-center focus:outline-none focus:border-brand-growth-neon transition-colors"
            />
          </div>
          <div className="p-3 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/20 text-center">
            <span className="text-brand-growth-neon text-sm">Stock resultante: <strong>{product.stock + Number(qty || 0)}</strong></span>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-growth-neon to-emerald-400 text-black font-bold disabled:opacity-50">
            {saving ? "Guardando..." : "Registrar Entrada"}
          </button>
        </form>
      </div>
    </div>
  );
}
