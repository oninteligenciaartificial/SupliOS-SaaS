"use client";

import { useEffect, useState, useCallback } from "react";
import { X, RefreshCw, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { useQrPaymentPolling } from "./useQrPaymentPolling";

interface Props {
  orderId: string;
  amount: number;
  currency?: string;
  onPaid: () => void;
  onCancel: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useCountdown(expiresAt: Date | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { remaining, label: `${mm}:${ss}` };
}

export function QrPaymentModal({ orderId, amount, currency = "BOB", onPaid, onCancel }: Props) {
  const { state, regenerate } = useQrPaymentPolling(orderId);
  const { remaining, label: countdown } = useCountdown(state.expiresAt);
  const [canceling, setCanceling] = useState(false);

  // Auto-close on paid
  useEffect(() => {
    if (state.status === "PAGADO") {
      const t = setTimeout(onPaid, 1500);
      return () => clearTimeout(t);
    }
  }, [state.status, onPaid]);

  const handleCancel = useCallback(async () => {
    setCanceling(true);
    await fetch(`/api/qr-payments/${orderId}`, { method: "DELETE" }).catch(() => null);
    setCanceling(false);
    onCancel();
  }, [orderId, onCancel]);

  // ESC to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCancel]);

  const isPaid    = state.status === "PAGADO";
  const isPending = state.status === "PENDIENTE";
  const isExpired = state.status === "EXPIRADO";
  const isError   = state.status === "error" || state.status === "FALLIDO";
  const isGenerating = state.status === "generating";
  const urgent    = remaining > 0 && remaining <= 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="qr-modal-title" className="font-semibold text-white">Pagar con QR</h2>
          <button
            onClick={handleCancel}
            disabled={canceling || isPaid}
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
            <p className="text-3xl font-bold text-white">{currency} {fmt(amount)}</p>
            <p className="text-sm text-brand-muted mt-1">Escanea con tu app bancaria</p>
          </div>

          {/* QR area */}
          <div className="w-56 h-56 flex items-center justify-center rounded-xl bg-white p-3">
            {isGenerating && (
              <Loader2 size={40} className="text-gray-400 animate-spin" />
            )}
            {isPending && state.qrPayload && (
              <QRCode value={state.qrPayload} size={200} bgColor="#ffffff" fgColor="#000000" />
            )}
            {isPaid && (
              <CheckCircle size={64} className="text-green-500" />
            )}
            {isExpired && (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Clock size={40} />
                <span className="text-xs font-medium">Expirado</span>
              </div>
            )}
            {isError && (
              <div className="flex flex-col items-center gap-2 text-red-400">
                <AlertCircle size={40} />
                <span className="text-xs font-medium text-center">{state.error ?? "Error"}</span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {isPending && state.expiresAt && (
            <div
              aria-live="polite"
              className={`flex items-center gap-1.5 text-sm font-mono font-medium ${urgent ? "text-red-400" : "text-brand-muted"}`}
            >
              <Clock size={14} />
              <span>Expira en {countdown}</span>
            </div>
          )}

          {/* Paid confirmation */}
          {isPaid && (
            <p aria-live="assertive" className="text-green-400 font-semibold text-sm">
              ¡Pago recibido!
            </p>
          )}

          {/* Error detail */}
          {isError && state.error && (
            <p className="text-red-400 text-xs text-center">{state.error}</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-3">
          {(isExpired || isError) && (
            <button
              onClick={regenerate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-kinetic-orange text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={15} />
              Nuevo QR
            </button>
          )}
          {!isPaid && (
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              {canceling ? "Cancelando..." : "Cancelar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
