"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Copy, ExternalLink } from "lucide-react";

interface Props {
  qrImageUrl: string;
  amount: number;
  onPaid: () => void;
  onCancel: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ManualQrModal({ qrImageUrl, amount, onPaid, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  // ESC to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      onPaid();
    }, 500);
  }

  function handleCopyAmount() {
    navigator.clipboard.writeText(String(amount.toFixed(2)));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="manual-qr-modal-title" className="font-semibold text-white">Pagar con QR</h2>
          <button
            onClick={onCancel}
            disabled={confirming}
            aria-label="Cerrar"
            className="text-brand-muted hover:text-white transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6 flex flex-col items-center gap-5">

          {/* Amount */}
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <p className="text-3xl font-bold text-white">Bs. {fmt(amount)}</p>
              <button
                onClick={handleCopyAmount}
                className="text-brand-muted hover:text-white transition-colors"
                title="Copiar monto"
              >
                <Copy size={16} />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-400 mt-1">Monto copiado</p>
            )}
            <p className="text-sm text-brand-muted mt-1">El cliente debe escanear y pagar este monto exacto</p>
          </div>

          {/* QR Image */}
          <div className="w-56 h-56 rounded-xl bg-white p-3 overflow-hidden flex items-center justify-center">
            <img
              src={qrImageUrl}
              alt="QR de pago"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Instructions */}
          <div className="text-center space-y-1">
            <p className="text-xs text-brand-muted">
              1. El cliente escanea el QR con su app bancaria
            </p>
            <p className="text-xs text-brand-muted">
              2. Verifica que recibiste el pago en tu cuenta
            </p>
            <p className="text-xs text-brand-muted">
              3. Confirmá abajo para registrar la venta
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <CheckCircle size={15} />
            {confirming ? "Registrando..." : "Confirmar Pago"}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
