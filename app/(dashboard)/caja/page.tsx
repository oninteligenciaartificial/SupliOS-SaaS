"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, ShoppingCart, TrendingUp, Package, XCircle, Printer,
  Banknote, CreditCard, Landmark, QrCode, CheckCircle, AlertTriangle, Loader2,
} from "lucide-react";

interface CajaOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  items: number;
  createdAt: string;
}

interface CajaData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  cancelled: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  orders: CajaOrder[];
}

interface CorteData {
  date: string;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalQr: number;
  totalVentas: number;
  totalOrders: number;
  corte: {
    id: string;
    montoRealEfectivo: number;
    diferencia: number;
    notas: string | null;
    savedAt: string;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CajaPage() {
  const [data, setData] = useState<CajaData | null>(null);
  const [corteData, setCorteData] = useState<CorteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [montoReal, setMontoReal] = useState("");
  const [notasCorte, setNotasCorte] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/caja").then((r) => r.ok ? r.json() : null),
      fetch("/api/caja").then((r) => r.ok ? r.json() : null),
    ]).then(([d, c]) => {
      if (d) setData(d);
      if (c) {
        setCorteData(c);
        if (c.corte) {
          setMontoReal(String(c.corte.montoRealEfectivo ?? ""));
          setNotasCorte(c.corte.notas ?? "");
        }
      }
      setLoading(false);
    });
  }, []);

  function printCorte() {
    if (!data) return;
    const win = window.open("", "_blank", "width=500,height=700");
    if (!win) return;
    const rows = data.orders.map((o) =>
      `<tr><td>${o.customerName}</td><td style="text-align:center">${o.items}</td><td style="text-align:right">Bs. ${fmt(o.total)}</td></tr>`
    ).join("");
    const top = data.topProducts.map((p) =>
      `<tr><td>${p.name}</td><td style="text-align:center">${p.qty}</td><td style="text-align:right">Bs. ${fmt(p.revenue)}</td></tr>`
    ).join("");
    const pm = corteData ? `
      <div class="row"><span>Efectivo:</span><span>Bs. ${fmt(corteData.totalEfectivo)}</span></div>
      <div class="row"><span>Tarjeta:</span><span>Bs. ${fmt(corteData.totalTarjeta)}</span></div>
      <div class="row"><span>Transferencia:</span><span>Bs. ${fmt(corteData.totalTransferencia)}</span></div>
      ${corteData.totalQr > 0 ? `<div class="row"><span>QR:</span><span>Bs. ${fmt(corteData.totalQr)}</span></div>` : ""}
    ` : "";
    const cierre = corteData?.corte ? `
      <div class="sep"></div>
      <h3>Cierre de Efectivo</h3>
      <div class="row"><span>Sistema:</span><span>Bs. ${fmt(corteData.totalEfectivo)}</span></div>
      <div class="row"><span>Real en caja:</span><span>Bs. ${fmt(corteData.corte.montoRealEfectivo)}</span></div>
      <div class="row ${corteData.corte.diferencia < 0 ? "red" : "green"}"><span>Diferencia:</span><span>${corteData.corte.diferencia >= 0 ? "+" : ""}Bs. ${fmt(corteData.corte.diferencia)}</span></div>
      ${corteData.corte.notas ? `<p style="font-size:11px;margin-top:6px">${corteData.corte.notas}</p>` : ""}
    ` : "";
    win.document.write(`<html><head><title>Corte de Caja</title>
    <style>body{font-family:monospace;font-size:13px;margin:20px}h2,h3{text-align:center}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:4px 6px;text-align:left}th{border-bottom:1px solid #ccc}.row{display:flex;justify-content:space-between;margin:4px 0}.total{font-size:18px;font-weight:bold;text-align:right}.sep{border-top:2px solid #333;margin:12px 0}.green{color:green}.red{color:red}</style>
    </head><body>
    <h2>Corte de Caja</h2>
    <p style="text-align:center">${new Date(data.date).toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
    <div class="sep"></div>
    <div class="row"><span>Total ventas:</span><span class="total">Bs. ${fmt(data.totalRevenue)}</span></div>
    <div class="row"><span>Pedidos:</span><span>${data.totalOrders}</span></div>
    <div class="row"><span>Ticket promedio:</span><span>Bs. ${fmt(data.avgTicket)}</span></div>
    <div class="row"><span>Cancelados:</span><span>${data.cancelled}</span></div>
    <div class="sep"></div>
    <h3>Por método de pago</h3>${pm}
    ${cierre}
    <div class="sep"></div>
    <h3>Top Productos</h3>
    <table><thead><tr><th>Producto</th><th>Cant.</th><th>Ingresos</th></tr></thead><tbody>${top}</tbody></table>
    <div class="sep"></div>
    <h3>Pedidos del dia</h3>
    <table><thead><tr><th>Cliente</th><th>Items</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    win.document.close();
    win.print();
  }

  async function saveCorte() {
    if (!montoReal.trim()) return;
    setSaving(true);
    setSaveError("");
    setSaveOk(false);
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        montoRealEfectivo: parseFloat(montoReal),
        notas: notasCorte.trim() || undefined,
      }),
    });
    const d = await res.json().catch(() => ({})) as { diferencia?: number; error?: string };
    setSaving(false);
    if (res.ok) {
      setSaveOk(true);
      setCorteData((prev) => prev ? {
        ...prev,
        corte: {
          id: "",
          montoRealEfectivo: parseFloat(montoReal),
          diferencia: d.diferencia ?? 0,
          notas: notasCorte.trim() || null,
          savedAt: new Date().toISOString(),
        },
      } : prev);
    } else {
      setSaveError(d.error ?? "Error al guardar");
    }
  }

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const montoRealNum = parseFloat(montoReal) || 0;
  const diferencia = corteData ? montoRealNum - corteData.totalEfectivo : 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Corte de Caja</h1>
          <p className="text-brand-muted mt-1 text-sm capitalize">{today}</p>
        </div>
        {data && (
          <button onClick={printCorte} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
            <Printer size={16} /> Imprimir
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-20 text-center text-brand-muted flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Cargando...
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-brand-muted">Error al cargar datos.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Ingresos del dia", value: `Bs. ${fmt(data.totalRevenue)}`, icon: DollarSign, color: "text-brand-growth-neon" },
              { label: "Pedidos", value: String(data.totalOrders), icon: ShoppingCart, color: "text-blue-400" },
              { label: "Ticket promedio", value: `Bs. ${fmt(data.avgTicket)}`, icon: TrendingUp, color: "text-brand-kinetic-orange" },
              { label: "Cancelados", value: String(data.cancelled), icon: XCircle, color: "text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-panel p-5 rounded-2xl">
                <Icon size={20} className={`${color} mb-3`} />
                <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
                <div className="text-xs text-brand-muted mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Payment method breakdown */}
          {corteData && (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-white text-sm">Ingresos por método de pago</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Efectivo", value: corteData.totalEfectivo, icon: <Banknote size={16} />, color: "text-brand-growth-neon" },
                  { label: "Tarjeta", value: corteData.totalTarjeta, icon: <CreditCard size={16} />, color: "text-blue-400" },
                  { label: "Transferencia", value: corteData.totalTransferencia, icon: <Landmark size={16} />, color: "text-purple-400" },
                  { label: "QR", value: corteData.totalQr, icon: <QrCode size={16} />, color: "text-yellow-400" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 space-y-1">
                    <div className={`flex items-center gap-1.5 ${color}`}>{icon}<span className="text-xs font-medium">{label}</span></div>
                    <div className="text-white font-bold text-sm">Bs. {fmt(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cierre de caja */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Cierre de Efectivo</h2>
              {corteData?.corte && (
                <span className="flex items-center gap-1.5 text-xs text-brand-growth-neon">
                  <CheckCircle size={12} /> Guardado
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-brand-muted">Efectivo en sistema</label>
                <div className="px-4 py-3 rounded-xl bg-white/5 text-white font-bold">
                  Bs. {fmt(corteData?.totalEfectivo ?? 0)}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-brand-muted">Monto real en caja (contar físicamente)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={montoReal}
                  onChange={(e) => { setMontoReal(e.target.value); setSaveOk(false); }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
                />
              </div>
            </div>

            {montoReal && !isNaN(montoRealNum) && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                diferencia === 0
                  ? "bg-brand-growth-neon/10 border-brand-growth-neon/30 text-brand-growth-neon"
                  : diferencia > 0
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {diferencia === 0
                  ? <CheckCircle size={14} />
                  : <AlertTriangle size={14} />}
                <span className="text-sm font-medium">
                  Diferencia: {diferencia >= 0 ? "+" : ""}Bs. {fmt(diferencia)}
                  {diferencia > 0 && " (sobrante)"}
                  {diferencia < 0 && " (faltante)"}
                  {diferencia === 0 && " (exacto)"}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-brand-muted">Notas (opcional)</label>
              <textarea
                value={notasCorte}
                onChange={(e) => setNotasCorte(e.target.value)}
                placeholder="Observaciones del cierre..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-white/20 transition-colors text-sm resize-none"
              />
            </div>

            {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
            {saveOk && <p className="text-brand-growth-neon text-xs flex items-center gap-1"><CheckCircle size={11} /> Corte guardado correctamente</p>}

            <button
              onClick={saveCorte}
              disabled={!montoReal.trim() || saving || isNaN(montoRealNum)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-kinetic-orange text-black font-bold text-sm disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Guardar Cierre
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} className="text-brand-kinetic-orange" />
                <h2 className="font-bold text-white">Mas vendidos hoy</h2>
              </div>
              {data.topProducts.length === 0 ? (
                <p className="text-brand-muted text-sm py-4 text-center">Sin ventas aun.</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => {
                    const pct = data.topProducts[0].revenue > 0 ? (p.revenue / data.topProducts[0].revenue) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-medium truncate pr-4">{p.name}</span>
                          <span className="text-brand-muted flex-shrink-0">{p.qty} uds · Bs. {fmt(p.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-brand-kinetic-orange" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orders list */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <ShoppingCart size={16} className="text-brand-kinetic-orange" />
                <h2 className="font-bold text-white">Pedidos del dia</h2>
              </div>
              {data.orders.length === 0 ? (
                <p className="text-brand-muted text-sm py-8 text-center">No hay pedidos hoy.</p>
              ) : (
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {data.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="text-sm font-medium text-white">{o.customerName}</div>
                        <div className="text-xs text-brand-muted">{new Date(o.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">Bs. {fmt(o.total)}</div>
                        <div className="text-xs text-brand-muted">{o.items} item{o.items !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
