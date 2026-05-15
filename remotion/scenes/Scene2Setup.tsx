import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const BUSINESS_TYPES = [
  { icon: '👕', label: 'Ropa', color: '#8B5CF6' },
  { icon: '💊', label: 'Farmacia', color: '#10B981' },
  { icon: '🔧', label: 'Ferretería', color: '#F59E0B' },
  { icon: '📱', label: 'Electrónica', color: '#3B82F6' },
  { icon: '💪', label: 'Suplementos', color: '#EF4444' },
  { icon: '🏪', label: 'General', color: '#FF6B00' },
];

export const Scene2Setup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelSlide = interpolate(frame, [0, 30], [-80, 0], { extrapolateRight: 'clamp' });
  const panelOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: 'clamp' });
  const selectedIndex = 5; // "General" is selected

  const stepOpacity = (delay: number) =>
    interpolate(frame, [delay, delay + 25], [0, 1], { extrapolateRight: 'clamp' });
  const stepY = (delay: number) =>
    interpolate(frame, [delay, delay + 25], [15, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 52,
          background: '#111111',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C940' }} />
        <div style={{ flex: 1 }} />
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '4px 16px',
            color: '#666',
            fontSize: 12,
          }}
        >
          gestios.app/onboarding
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            opacity: panelOpacity,
            transform: `translateY(${panelSlide}px)`,
            background: '#111',
            border: '1px solid #222',
            borderRadius: 20,
            padding: 48,
            width: 760,
            maxWidth: '100%',
          }}
        >
          {/* Step indicator */}
          <div
            style={{
              opacity: titleOpacity,
              display: 'flex',
              gap: 8,
              marginBottom: 32,
            }}
          >
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 2,
                  background: s === 1 ? '#FF6B00' : '#333',
                }}
              />
            ))}
          </div>

          <div style={{ opacity: titleOpacity }}>
            <p style={{ color: '#FF6B00', fontSize: 13, fontWeight: 600, margin: '0 0 8px', letterSpacing: '0.08em' }}>
              PASO 1 DE 3
            </p>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>
              Configura tu negocio
            </h2>
            <p style={{ color: '#666', fontSize: 16, margin: '0 0 32px' }}>
              Selecciona el tipo de negocio para personalizar GestiOS
            </p>
          </div>

          {/* Business type grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {BUSINESS_TYPES.map((type, i) => {
              const isSelected = i === selectedIndex;
              const cardDelay = 30 + i * 12;
              return (
                <div
                  key={type.label}
                  style={{
                    opacity: stepOpacity(cardDelay),
                    transform: `translateY(${stepY(cardDelay)}px)`,
                    padding: '20px 16px',
                    borderRadius: 12,
                    border: isSelected ? `2px solid ${type.color}` : '2px solid #222',
                    background: isSelected ? `${type.color}15` : '#0a0a0a',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{type.icon}</span>
                  <span
                    style={{
                      color: isSelected ? type.color : '#ccc',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 14,
                    }}
                  >
                    {type.label}
                  </span>
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: type.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Continue button */}
          <div
            style={{
              opacity: stepOpacity(100),
              marginTop: 32,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
                color: 'white',
                padding: '14px 32px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Continuar →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
