import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CART_ITEMS = [
  { name: 'Camiseta Básica', qty: 2, price: 89.0 },
  { name: 'Pantalón Jean Slim', qty: 1, price: 245.0 },
  { name: 'Calcetines (Pack x3)', qty: 1, price: 35.0 },
];

const PRODUCTS_GRID = [
  { name: 'Camiseta Básica', price: 89, color: '#6366F1' },
  { name: 'Polo Bordado', price: 120, color: '#8B5CF6' },
  { name: 'Pantalón Jean', price: 245, color: '#3B82F6' },
  { name: 'Shorts Cargo', price: 165, color: '#06B6D4' },
  { name: 'Zapatillas', price: 420, color: '#10B981' },
  { name: 'Calcetines', price: 35, color: '#F59E0B' },
];

export const Scene4POS: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const panelY = interpolate(frame, [0, 25], [30, 0], { extrapolateRight: 'clamp' });

  const productOpacity = (i: number) =>
    interpolate(frame, [20 + i * 8, 40 + i * 8], [0, 1], { extrapolateRight: 'clamp' });
  const productScale = (i: number) =>
    spring({ frame: Math.max(0, frame - 20 - i * 8), fps, config: { damping: 18, stiffness: 140 } });

  const totalOpacity = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });
  const totalScale = spring({ frame: Math.max(0, frame - 100), fps, config: { damping: 12, stiffness: 200 } });

  const total = CART_ITEMS.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: '#111',
          borderBottom: '1px solid #222',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
          Gesti<span style={{ color: '#FF6B00' }}>OS</span>
        </span>
        <div
          style={{
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.4)',
            borderRadius: 6,
            padding: '4px 12px',
            color: '#FF6B00',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          PUNTO DE VENTA
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: '#555', fontSize: 13 }}>Caja #1 — Juan Pérez</div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Product grid */}
        <div
          style={{
            flex: 1,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ color: '#888', fontSize: 13, fontWeight: 600 }}>PRODUCTOS</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {PRODUCTS_GRID.map((product, i) => (
              <div
                key={product.name}
                style={{
                  opacity: productOpacity(i),
                  transform: `scale(${productScale(i)})`,
                  background: '#111',
                  border: `1px solid ${product.color}30`,
                  borderRadius: 12,
                  padding: '20px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: product.color,
                  }}
                />
                <span style={{ color: '#ccc', fontWeight: 600, fontSize: 13 }}>{product.name}</span>
                <span style={{ color: product.color, fontWeight: 700, fontSize: 16 }}>Bs. {product.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cart panel */}
        <div
          style={{
            opacity: panelOpacity,
            transform: `translateY(${panelY}px)`,
            width: 320,
            background: '#111',
            borderLeft: '1px solid #1a1a1a',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Venta Actual</h3>
            <p style={{ color: '#555', fontSize: 12, margin: '2px 0 0' }}>3 productos</p>
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CART_ITEMS.map((item, i) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ color: '#555', fontSize: 12 }}>x{item.qty}</div>
                </div>
                <div style={{ color: '#FF9A3C', fontWeight: 600, fontSize: 14 }}>
                  Bs. {(item.qty * item.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#1a1a1a', margin: '0 24px' }} />

          {/* Total */}
          <div
            style={{
              padding: '16px 24px',
              opacity: totalOpacity,
              transform: `scale(${totalScale})`,
              transformOrigin: 'bottom',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ color: '#888', fontSize: 14 }}>TOTAL</span>
              <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>
                Bs. {total.toFixed(2)}
              </span>
            </div>

            {/* Payment methods */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['Efectivo', 'QR', 'Tarjeta'].map((method, i) => (
                <div
                  key={method}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: i === 0 ? '2px solid #FF6B00' : '2px solid #222',
                    background: i === 0 ? 'rgba(255,107,0,0.1)' : 'transparent',
                    color: i === 0 ? '#FF6B00' : '#666',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {method}
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
                color: 'white',
                padding: '14px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 16,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              Cobrar Bs. {total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
