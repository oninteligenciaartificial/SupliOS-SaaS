"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Package, XCircle, Printer } from "lucide-react";

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

const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CajaPage() {
  const [data, setData] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/caja").then(async (r) => {
      if (r.ok) setData(await r.json());
      setLoading(false);
    });
  }, []);

  function printCorte() {
    if (!data) return;
    const win = window.open("", "_blank", "width=500,height=700");
    if (!win) return;
    const rows = data.orders.map((o) =>
      `<tr><td>${o.customerName}</td><td style="text-align:center">${o.items}</td><td style="text-align:right">Bs. ${fmt(o.total)}</td><td>${o.status}</td></tr>`
    ).join("");
    const top = data.topProducts.map((p) =>
      `<tr><td>${p.name}</td><td style="text-align:center">${p.qty}</td><td style="text-align:right">Bs. ${fmt(p.revenue)}</td></tr>`
    ).join("");
    win.document.write(`<html><head><title>Corte de Caja</title>
    <style>body{font-family:monospace;font-size:13px;margin:20px}h2,h3{text-align:center}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:4px 6px;text-align:left}th{border-bottom:1px solid #ccc}.kpi{display:flex;justify-content:space-between;margin:4px 0}.total{font-size:18px;font-weight:bold;text-align:right}.sep{border-top:2px solid #333;margin:12px 0}</style>
    </head><body>
    <h2>Corte de Caja</h2>
    <p style="text-align:center">${new Date(data.date).toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
    <div class="sep"></div>
    <div className="kpi"><span>Total Ventas:</span><span class="total">Bs. {fmt(data.totalRevenue)}</span></div>
    <div class="kpi"><span>Pedidos:</span><span>${data.totalOrders}</span></div>
    <div class="kpi"><span>Ticket promedio:</span><span>Bs. {fmt(data.avgTicket)}</span></div>
    <div class="kpi"><span>Cancelados:</span><span>${data.cancelled}</span></div>
    <div class="sep"></div>
    <h3>Top Productos</h3>
    <table><thead><tr><th>Producto</th><th>Cant.</th><th>Ingresos</th></tr></thead><tbody>${top}</tbody></table>
    <div class="sep"></div>
    <h3>Pedidos del dia</h3>
    <table><thead><tr><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    win.document.close();
    win.print();
  }

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="flex justify-between items-end animate-pop">
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
        <div className="py-20 text-center text-brand-muted">Cargando...</div>
      ) : !data ? (
        <div className="py-20 text-center text-brand-muted">Error al cargar datos.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pop">
            {[
              { label: "Ingresos del dia", value: `Bs. ${fmt(data.totalRevenue)}`, icon: DollarSign, color: "text-brand-growth-neon" },
              { label: "Pedidos", value: data.totalOrders, icon: ShoppingCart, color: "text-blue-400" },
              { label: "Ticket promedio", value: `Bs. ${fmt(data.avgTicket)}`, icon: TrendingUp, color: "text-brand-kinetic-orange" },
              { label: "Cancelados", value: data.cancelled, icon: XCircle, color: "text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-panel p-5 rounded-2xl">
                <Icon size={20} className={`${color} mb-3`} />
                <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
                <div className="text-xs text-brand-muted mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="glass-panel rounded-2xl p-6 animate-pop">
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
            <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
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
