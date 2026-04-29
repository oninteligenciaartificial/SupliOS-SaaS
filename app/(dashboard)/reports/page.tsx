"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, Users, AlertTriangle, Package, DollarSign, Download, CreditCard, UserCheck, Clock, Tag } from "lucide-react";
import { formatMoney } from "@/lib/currency";

interface ReportData {
  currency: string;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalMargin: number;
  topSelling: { name: string; quantity: number; revenue: number; margin: number }[];
  salesByCategory: { name: string; revenue: number; quantity: number }[];
  topCustomers: { customerId: string | null; customerName: string; total: number; orders: number }[];
  lowStock: { id: string; name: string; stock: number; minStock: number }[];
  paymentBreakdown: Record<string, number>;
  salesByStaff: { staffId: string | null; staffName: string; total: number; orders: number }[];
  noMovement: { id: string; name: string; stock: number; updatedAt: string }[];
}

const PRESETS = [
  { label: "Este mes", from: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]; }, to: () => new Date().toISOString().split("T")[0] },
  { label: "Mes pasado", from: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0]; }, to: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0]; } },
  { label: "Ultimos 90 dias", from: () => new Date(Date.now() - 90 * 864e5).toISOString().split("T")[0], to: () => new Date().toISOString().split("T")[0] },
  { label: "Este ano", from: () => `${new Date().getFullYear()}-01-01`, to: () => new Date().toISOString().split("T")[0] },
];

function today() { return new Date().toISOString().split("T")[0]; }
function monthStart() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]; }

const PAYMENT_LABELS: Record<string, string> = { EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia" };

export default function ReportsPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReport(f: string, t: string) {
    setLoading(true);
    const res = await fetch(`/api/reports?from=${f}&to=${t}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchReport(from, to); }, []);

  function applyPreset(preset: typeof PRESETS[0]) {
    const f = preset.from();
    const t = preset.to();
    setFrom(f);
    setTo(t);
    fetchReport(f, t);
  }

  function handleApply() { fetchReport(from, to); }

  const cur = data?.currency ?? "MXN";
  const fmt = (n: number) => formatMoney(n, cur);

  function exportExcel() {
    if (!data) return;
    const rows = [
      ["Reporte de Ventas", `${from} al ${to}`],
      [],
      ["Ingresos totales", data.totalRevenue],
      ["Margen de ganancia", data.totalMargin],
      ["Pedidos", data.totalOrders],
      ["Clientes", data.totalCustomers],
      ["Ticket promedio", data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0],
      [],
      ["Metodos de pago"],
      ["Metodo", "Monto"],
      ...Object.entries(data.paymentBreakdown).map(([m, v]) => [PAYMENT_LABELS[m] ?? m, v]),
      [],
      ["Ventas por categoria"],
      ["Categoria", "Ingresos", "Unidades"],
      ...data.salesByCategory.map((c) => [c.name, c.revenue, c.quantity]),
      [],
      ["Top Clientes"],
      ["Cliente", "Pedidos", "Total"],
      ...data.topCustomers.map((c) => [c.customerName, c.orders, c.total]),
      [],
      ["Ventas por empleado"],
      ["Empleado", "Pedidos", "Total"],
      ...data.salesByStaff.map((s) => [s.staffName, s.orders, s.total]),
      [],
      ["Top Productos vendidos"],
      ["Producto", "Unidades vendidas", "Ingresos", "Margen"],
      ...data.topSelling.map((p) => [p.name, p.quantity, p.revenue, p.margin]),
      [],
      ["Stock critico"],
      ["Producto", "Stock actual", "Stock minimo"],
      ...data.lowStock.map((p) => [p.name, p.stock, p.minStock]),
      [],
      ["Productos sin movimiento (30 dias)"],
      ["Producto", "Stock"],
      ...data.noMovement.map((p) => [p.name, p.stock]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${from}_${to}.csv`;
    a.click();
  }

  const avgTicket = data && data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0;
  const maxQty = data?.topSelling[0]?.quantity ?? 1;
  const maxCategoryRev = data?.salesByCategory[0]?.revenue ?? 1;
  const totalPayments = Object.values(data?.paymentBreakdown ?? {}).reduce((s, v) => s + v, 0);
  const maxCustomerTotal = data?.topCustomers[0]?.total ?? 1;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end animate-pop">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Reportes</h1>
          <p className="text-brand-muted mt-1">Analisis de ventas e inventario.</p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
              <Download size={15} /> Resumen CSV
            </button>
            <a
              href={`/api/reports/export?from=${from}&to=${to}`}
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-brand-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <Download size={15} /> Contabilidad CSV
            </a>
          </div>
        )}
      </header>

      <div className="glass-panel p-5 rounded-2xl flex flex-wrap gap-3 items-center animate-pop">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)} className="px-4 py-2 rounded-full border border-white/10 text-brand-muted hover:border-brand-kinetic-orange hover:text-white text-sm transition-colors">
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange transition-colors" />
          <span className="text-brand-muted text-sm">a</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-kinetic-orange transition-colors" />
          <button onClick={handleApply} className="px-4 py-2 rounded-xl bg-brand-kinetic-orange text-black font-bold text-sm hover:bg-brand-kinetic-orange-light transition-colors">
            Aplicar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-brand-muted">Calculando reporte...</div>
      ) : !data ? (
        <div className="py-16 text-center text-brand-muted">Error al cargar datos.</div>
      ) : (
        <>
          {/* KPIs principales */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pop">
            {[
              { label: "Ingresos totales", value: fmt(data.totalRevenue), icon: DollarSign, color: "text-brand-growth-neon" },
              { label: "Margen de ganancia", value: fmt(data.totalMargin), icon: TrendingUp, color: "text-brand-kinetic-orange" },
              { label: "Pedidos", value: String(data.totalOrders), icon: ShoppingCart, color: "text-blue-400" },
              { label: "Ticket promedio", value: fmt(avgTicket), icon: TrendingUp, color: "text-white" },
            ].map((kpi) => (
              <div key={kpi.label} className="glass-panel p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-brand-muted text-xs font-medium">{kpi.label}</span>
                  <div className={`p-1.5 rounded-lg bg-white/5 ${kpi.color}`}>
                    <kpi.icon size={16} />
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-white">{kpi.value}</div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Productos */}
            <section className="space-y-4 animate-pop">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Package size={20} className="text-brand-kinetic-orange" />
                Top Productos
              </h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                {data.topSelling.length === 0 ? (
                  <div className="py-12 text-center text-brand-muted text-sm">Sin ventas en este periodo.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.topSelling.map((p, i) => (
                      <div key={p.name} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-brand-muted font-mono text-sm w-5">#{i + 1}</span>
                            <span className="font-medium text-white">{p.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-brand-growth-neon">{fmt(p.revenue)}</div>
                            <div className="text-xs text-brand-kinetic-orange">+{fmt(p.margin)} margen</div>
                            <div className="text-xs text-brand-muted">{p.quantity} uds.</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-brand-kinetic-orange to-brand-kinetic-orange-light" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Ventas por Categoria */}
            <section className="space-y-4 animate-pop">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Tag size={20} className="text-blue-400" />
                Ventas por Categoria
              </h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                {data.salesByCategory.length === 0 ? (
                  <div className="py-12 text-center text-brand-muted text-sm">Sin ventas en este periodo.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.salesByCategory.map((c) => {
                      const pct = maxCategoryRev > 0 ? (c.revenue / maxCategoryRev) * 100 : 0;
                      return (
                        <div key={c.name} className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{c.name}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-blue-400">{fmt(c.revenue)}</div>
                              <div className="text-xs text-brand-muted">{c.quantity} uds.</div>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Alertas de Stock */}
            <section className="space-y-4 animate-pop">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Alertas de Stock
              </h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                {data.lowStock.length === 0 ? (
                  <div className="py-12 text-center text-brand-muted text-sm">Todo el inventario esta en buen nivel.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.lowStock.map((p) => (
                      <div key={p.id} className="p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-xs text-brand-muted mt-0.5">Minimo: {p.minStock} uds.</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-display font-bold ${p.stock === 0 ? "text-red-400" : p.stock <= p.minStock ? "text-yellow-400" : "text-white"}`}>{p.stock}</div>
                          <div className="text-xs text-brand-muted">en stock</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Metodos de pago */}
            <section className="space-y-4 animate-pop">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-blue-400" />
                Metodos de Pago
              </h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                {Object.keys(data.paymentBreakdown).length === 0 ? (
                  <div className="py-12 text-center text-brand-muted text-sm">Sin ventas en este periodo.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {Object.entries(data.paymentBreakdown).map(([method, amount]) => {
                      const pct = totalPayments > 0 ? (amount / totalPayments) * 100 : 0;
                      return (
                        <div key={method} className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{PAYMENT_LABELS[method] ?? method}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-brand-growth-neon">{fmt(amount)}</div>
                              <div className="text-xs text-brand-muted">{pct.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Top Clientes */}
            {data.topCustomers.length > 0 && (
              <section className="space-y-4 animate-pop">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-brand-growth-neon" />
                  Top Clientes
                </h2>
                <div className="glass-panel rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {data.topCustomers.map((c, i) => {
                      const pct = maxCustomerTotal > 0 ? (c.total / maxCustomerTotal) * 100 : 0;
                      return (
                        <div key={c.customerId} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-brand-muted font-mono text-sm w-5">#{i + 1}</span>
                              <div>
                                <div className="font-medium text-white">{c.customerName}</div>
                                <div className="text-xs text-brand-muted">{c.orders} pedido{c.orders !== 1 ? "s" : ""}</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-brand-growth-neon">{fmt(c.total)}</div>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-brand-growth-neon" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Ventas por empleado */}
            {data.salesByStaff.length > 0 && (
              <section className="space-y-4 animate-pop">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-brand-kinetic-orange" />
                  Ventas por Empleado
                </h2>
                <div className="glass-panel rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {data.salesByStaff.sort((a, b) => b.total - a.total).map((s) => (
                      <div key={s.staffId} className="p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{s.staffName}</div>
                          <div className="text-xs text-brand-muted">{s.orders} pedido{s.orders !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="text-sm font-bold text-brand-growth-neon">{fmt(s.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sin movimiento */}
          {data.noMovement.length > 0 && (
            <section className="space-y-4 animate-pop">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Clock size={20} className="text-yellow-400" />
                Sin Movimiento (30 dias)
              </h2>
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-y md:divide-y-0 divide-white/5">
                  {data.noMovement.map((p) => (
                    <div key={p.id} className="p-4 border-b border-white/5">
                      <div className="font-medium text-white text-sm">{p.name}</div>
                      <div className="text-xs text-brand-muted mt-0.5">{p.stock} en stock</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
