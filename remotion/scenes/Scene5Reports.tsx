import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const MONTHLY_DATA = [
  { month: 'Ene', sales: 8200, prev: 6800 },
  { month: 'Feb', sales: 9400, prev: 7200 },
  { month: 'Mar', sales: 7800, prev: 8100 },
  { month: 'Abr', sales: 11200, prev: 9000 },
  { month: 'May', sales: 13400, prev: 10200 },
  { month: 'Jun', sales: 15600, prev: 11800 },
];

const STATS = [
  { label: 'Ventas Hoy', value: 'Bs. 3,240', change: '+18%', up: true },
  { label: 'Productos Vendidos', value: '47', change: '+12%', up: true },
  { label: 'Ticket Promedio', value: 'Bs. 68.9', change: '-3%', up: false },
  { label: 'Clientes Nuevos', value: '8', change: '+25%', up: true },
];

export const Scene5Reports: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: 'clamp' });

  const statOpacity = (i: number) =>
    interpolate(frame, [15 + i * 12, 35 + i * 12], [0, 1], { extrapolateRight: 'clamp' });
  const statScale = (i: number) =>
    spring({ frame: Math.max(0, frame - 15 - i * 12), fps, config: { damping: 16, stiffness: 150 } });

  const maxSales = Math.max(...MONTHLY_DATA.map((d) => d.sales));

  const barProgress = (i: number) =>
    interpolate(frame, [60 + i * 10, 100 + i * 10], [0, 1], { extrapolateRight: 'clamp' });

  const chartOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: 40,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>
            Reportes & Analíticas
          </h2>
          <p style={{ color: '#555', fontSize: 14, margin: '4px 0 0' }}>Junio 2025 — Resumen mensual</p>
        </div>
        <div
          style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: 8,
            padding: '8px 16px',
            color: '#888',
            fontSize: 13,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#FF6B00' }}>●</span> Último mes
          <span style={{ marginLeft: 8 }}>▼</span>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              opacity: statOpacity(i),
              transform: `scale(${statScale(i)})`,
              background: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              padding: '20px 20px',
            }}
          >
            <p style={{ color: '#555', fontSize: 11, fontWeight: 600, margin: '0 0 8px', letterSpacing: '0.06em' }}>
              {stat.label.toUpperCase()}
            </p>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{stat.value}</p>
            <span
              style={{
                color: stat.up ? '#22C55E' : '#EF4444',
                fontSize: 13,
                fontWeight: 600,
                background: stat.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {stat.change} vs mes anterior
            </span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div
        style={{
          opacity: chartOpacity,
          flex: 1,
          background: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Ventas Mensuales (Bs.)</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#FF6B00' }} />
              <span style={{ color: '#888' }}>Este año</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#333' }} />
              <span style={{ color: '#888' }}>Año anterior</span>
            </div>
          </div>
        </div>

        {/* Bars */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 16,
          }}
        >
          {MONTHLY_DATA.map((data, i) => {
            const progress = barProgress(i);
            const barHeight = (data.sales / maxSales) * 160;
            const prevBarHeight = (data.prev / maxSales) * 160;

            return (
              <div
                key={data.month}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Value label */}
                <span
                  style={{
                    color: '#FF9A3C',
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: progress,
                  }}
                >
                  {(data.sales / 1000).toFixed(1)}k
                </span>

                {/* Bar group */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    gap: 3,
                    alignItems: 'flex-end',
                    height: 160,
                  }}
                >
                  {/* Previous year bar */}
                  <div
                    style={{
                      flex: 1,
                      height: prevBarHeight * progress,
                      background: '#2a2a2a',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  {/* Current year bar */}
                  <div
                    style={{
                      flex: 1,
                      height: barHeight * progress,
                      background: 'linear-gradient(180deg, #FF9A3C 0%, #FF6B00 100%)',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                </div>

                {/* Month label */}
                <span style={{ color: '#555', fontSize: 12 }}>{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
