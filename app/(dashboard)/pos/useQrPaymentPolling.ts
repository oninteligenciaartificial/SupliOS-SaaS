"use client";

import { useState, useEffect, useRef } from "react";

export type QrStatus = "generating" | "PENDIENTE" | "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO" | "error";

export interface QrPaymentState {
  status: QrStatus;
  qrPayload: string | null;
  qrImageUrl: string | null;
  expiresAt: Date | null;
  amount: number | null;
  error: string | null;
}

const INITIAL: QrPaymentState = {
  status: "generating",
  qrPayload: null,
  qrImageUrl: null,
  expiresAt: null,
  amount: null,
  error: null,
};

const TERMINAL: QrStatus[] = ["PAGADO", "EXPIRADO", "CANCELADO", "FALLIDO", "error"];
const POLL_INTERVAL = 3000;

export function useQrPaymentPolling(orderId: string | null) {
  const [state, setState] = useState<QrPaymentState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearPoll() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }

  async function generate() {
    if (!orderId) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setState(INITIAL);

    const res = await fetch(`/api/qr-payments/${orderId}`, {
      method: "POST",
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!res) return; // aborted
    if (res.status === 409) {
      // QR already active — GET existing
      poll();
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setState((s) => ({ ...s, status: "error", error: body.error ?? "Error al generar QR" }));
      return;
    }
    const data = await res.json() as { qrPayload: string; qrImageUrl?: string; expiresAt: string; };
    setState({ status: "PENDIENTE", qrPayload: data.qrPayload, qrImageUrl: data.qrImageUrl ?? null, expiresAt: new Date(data.expiresAt), amount: null, error: null });
    startPolling();
  }

  async function poll() {
    if (!orderId) return;
    const res = await fetch(`/api/qr-payments/${orderId}`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json() as {
      status: QrStatus;
      qrPayload?: string;
      qrImageUrl?: string;
      expiresAt?: string;
      amount?: number;
    };
    setState((prev) => ({
      ...prev,
      status: data.status,
      qrPayload: data.qrPayload ?? prev.qrPayload,
      qrImageUrl: data.qrImageUrl ?? prev.qrImageUrl,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : prev.expiresAt,
      amount: data.amount ?? prev.amount,
    }));
    if (TERMINAL.includes(data.status)) clearPoll();
  }

  function startPolling() {
    clearPoll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
  }

  // Generate on mount / orderId change
  useEffect(() => {
    if (!orderId) return;
    generate();
    return () => {
      abortRef.current?.abort();
      clearPoll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return { state, regenerate: generate };
}
