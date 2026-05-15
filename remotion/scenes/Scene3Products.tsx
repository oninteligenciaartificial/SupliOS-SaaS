import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const PRODUCTS = [
  { name: 'Camiseta Básica Negra', sku: 'CAM-001', stock: 45, price: 'Bs. 89.00', category: 'Ropa' },
  { name: 'Pantalón Jean Slim', sku: 'PAN-002', stock: 23, price: 'Bs. 245.00', category: 'Ropa' },
  { name: 'Zapatillas Running', sku: 'ZAP-003', stock: 12, price: 'Bs. 420.00', category: 'Calzado' },
];

export const Scene3Products: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sidebarOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarX = interpolate(frame, [0, 25], [-200, 0], { extrapolateRight: 'clamp' });
  const mainOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });

  const rowOpacity = (i: number) =>
    interpolate(frame, [50 + i * 20, 75 + i * 20], [0, 1], { extrapolateRight: 'clamp' });
  const rowX = (i: number) =>
    interpolate(frame, [50 + i * 20, 75 + i * 20], [30, 0], { extrapolateRight: 'clamp' });

  const formScale = spring({ frame: Math.max(0, frame - 80), fps, config: { damping: 16, stiffness: 120 } });
  const formOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          opacity: sidebarOpacity,
          transform: `translateX(${sidebarX}px)`,
          width: 220,
          background: '#111',
          borderRight: '1px solid #222',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
            Gesti<span style={{ color: '#FF6B00' }}>OS</span>
          </span>
        </div>

        {/* Nav items */}
        {[
          { icon: '📊', label: 'Dashboard', active: false },
          { icon: '📦', label: 'Productos', active: true },
          { icon: '🛒', label: 'Ventas', active: false },
          { icon: '👥', label: 'Clientes', active: false },
          { icon: '📈', label: 'Reportes', active: false },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: item.active ? 'rgba(255,107,0,0.12)' : 'transparent',
              borderLeft: item.active ? '3px solid #FF6B00' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span
              style={{
                color: item.active ? '#FF6B00' : '#888',
                fontWeight: item.active ? 600 : 400,
                fontSize: 14,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', opacity: mainOpacity }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 32px',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Productos</h2>
            <p style={{ color: '#555', fontSize: 13, margin: '2px 0 0' }}>Gestiona tu inventario</p>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
              color: 'white',
              padding: '8px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            + Agregar Producto
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 0 }}>
          {/* Table */}
          <div style={{ flex: 1, padding: 24 }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                padding: '0 16px 12px',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              {['Producto', 'SKU', 'Categoría', 'Stock', 'Precio'].map((h) => (
                <span key={h} style={{ color: '#555', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {PRODUCTS.map((p, i) => (
              <div
                key={p.sku}
                style={{
                  opacity: rowOpacity(i),
                  transform: `translateX(${rowX(i)}px)`,
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '14px 16px',
                  borderBottom: '1px solid #111',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#e0e0e0', fontWeight: 500, fontSize: 14 }}>{p.name}</span>
                <span style={{ color: '#666', fontSize: 13, fontFamily: 'monospace' }}>{p.sku}</span>
                <span style={{ color: '#888', fontSize: 13 }}>{p.category}</span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: p.stock > 20 ? '#22C55E' : p.stock > 10 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                  <span style={{ color: '#ccc', fontSize: 13 }}>{p.stock}</span>
                </div>
                <span style={{ color: '#FF9A3C', fontWeight: 600, fontSize: 14 }}>{p.price}</span>
              </div>
            ))}
          </div>

          {/* Add product form panel */}
          <div
            style={{
              opacity: formOpacity,
              transform: `scaleX(${formScale})`,
              transformOrigin: 'right',
              width: 280,
              background: '#111',
              borderLeft: '1px solid #1a1a1a',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Producto</h3>

            {[
              { label: 'Nombre del producto', value: 'Polo Bordado Premium' },
              { label: 'Precio (Bs.)', value: '120.00' },
              { label: 'Stock inicial', value: '30' },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ color: '#666', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>
                  {field.label.toUpperCase()}
                </label>
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#e0e0e0',
                    fontSize: 14,
                  }}
                >
                  {field.value}
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: 'auto',
                background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
                color: 'white',
                padding: '12px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              Guardar Producto
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
