const NAV_ITEMS = [
  { label: "Dashboard", icon: "▦", active: true },
  { label: "POS", icon: "⊞" },
  { label: "Inventario", icon: "☰" },
  { label: "Clientes", icon: "◎" },
  { label: "Ventas", icon: "↗" },
];

const STATS = [
  { label: "Ventas hoy", value: "Bs. 1,240", sub: "+18% vs ayer", color: "text-[#FF6B00]" },
  { label: "Productos", value: "48", sub: "3 bajo stock", color: "text-[#00af74]" },
  { label: "Clientes", value: "127", sub: "5 nuevos hoy", color: "text-[#ffb693]" },
];

const BAR_DATA = [
  { label: "L", height: 40 },
  { label: "M", height: 65 },
  { label: "M", height: 50 },
  { label: "J", height: 80 },
  { label: "V", height: 95 },
  { label: "S", height: 70 },
  { label: "D", height: 30 },
];

const ORDERS = [
  { id: "#1042", client: "María L.", total: "Bs. 340", status: "Pagado" },
  { id: "#1041", client: "Carlos R.", total: "Bs. 120", status: "Pendiente" },
  { id: "#1040", client: "Ana G.", total: "Bs. 580", status: "Pagado" },
];

export function DashboardMockup() {
  return (
    <div className="hidden md:block relative w-full max-w-[520px] mx-auto">
      {/* Glow behind mockup */}
      <div className="absolute -inset-6 bg-[#FF6B00]/10 rounded-3xl blur-3xl pointer-events-none" />

      {/* Browser chrome wrapper */}
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(255,107,0,0.15)]"
        style={{
          transform: "perspective(1000px) rotateX(3deg) rotateY(-6deg)",
          background: "#111317",
        }}
      >
        {/* Browser title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1c20] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-[#0c0e12] rounded-md px-3 py-1 text-[10px] text-white/30 flex items-center gap-2">
              <span className="text-[#FF6B00]">🔒</span> app.gestios.com/dashboard
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="flex" style={{ height: "320px" }}>
          {/* Sidebar */}
          <div className="w-36 bg-[#0c0e12] border-r border-white/5 flex flex-col py-3 shrink-0">
            <div className="px-3 mb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#FF6B00]">GestiOS.</span>
            </div>
            <nav className="flex flex-col gap-0.5 px-2">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                    item.active
                      ? "bg-[#FF6B00]/20 text-[#FF6B00] font-medium"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <span className="text-[12px]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#111317]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-[11px] font-bold text-white">Dashboard</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/20 flex items-center justify-center text-[8px] text-[#FF6B00]">◎</div>
                <span className="text-[9px] text-white/40">Admin</span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-3 space-y-3">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {STATS.map((stat) => (
                  <div key={stat.label} className="bg-[#1a1c20] rounded-lg p-2.5 border border-white/5">
                    <div className="text-[8px] text-white/40 mb-1">{stat.label}</div>
                    <div className={`text-[11px] font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[7px] text-white/30 mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Chart + table row */}
              <div className="grid grid-cols-5 gap-2">
                {/* Mini bar chart */}
                <div className="col-span-2 bg-[#1a1c20] rounded-lg p-2.5 border border-white/5">
                  <div className="text-[8px] text-white/40 mb-2">Ventas semana</div>
                  <div className="flex items-end gap-1 h-16">
                    {BAR_DATA.map((bar, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: `${bar.height}%`,
                            background:
                              bar.height === Math.max(...BAR_DATA.map((b) => b.height))
                                ? "#FF6B00"
                                : "rgba(255,107,0,0.25)",
                          }}
                        />
                        <span className="text-[6px] text-white/30">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders */}
                <div className="col-span-3 bg-[#1a1c20] rounded-lg p-2.5 border border-white/5">
                  <div className="text-[8px] text-white/40 mb-2">Ultimas ventas</div>
                  <div className="space-y-1.5">
                    {ORDERS.map((order) => (
                      <div key={order.id} className="flex items-center justify-between text-[8px]">
                        <span className="text-white/50 font-mono">{order.id}</span>
                        <span className="text-white/70 flex-1 px-2 truncate">{order.client}</span>
                        <span className="text-[#ffb693] font-medium mr-2">{order.total}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[7px] font-medium ${
                            order.status === "Pagado"
                              ? "bg-[#00af74]/20 text-[#00af74]"
                              : "bg-[#FEBC2E]/20 text-[#FEBC2E]"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
