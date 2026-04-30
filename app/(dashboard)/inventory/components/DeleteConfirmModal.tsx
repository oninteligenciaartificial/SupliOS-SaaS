"use client";

import { Trash2 } from "lucide-react";

interface Props {
  productSingular: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ productSingular, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
        <div className="text-red-400"><Trash2 size={40} className="mx-auto" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Eliminar {productSingular.toLowerCase()}</h2>
          <p className="text-brand-muted mt-2">{productSingular} se desactivará del inventario.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
