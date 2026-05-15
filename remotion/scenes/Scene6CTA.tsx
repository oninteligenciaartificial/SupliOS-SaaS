import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const FEATURES = [
  { icon: '📦', label: 'Inventario ilimitado' },
  { icon: '🛒', label: 'POS en la nube' },
  { icon: '📊', label: 'Reportes en tiempo real' },
  { icon: '🧾', label: 'Facturación SIAT' },
  { icon: '📱', label: 'WhatsApp integrado' },
  { icon: '🔒', label: 'Multi-usuario seguro' },
];

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Celebration particles
  const particleData = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 100,
    delay: (i * 7) % 30,
    color: i % 3 === 0 ? '#FF6B00' : i % 3 === 1 ? '#FF9A3C' : '#FFD700',
    size: 4 + (i % 4) * 2,
    speed: 0.8 + (i % 5) * 0.3,
  }));

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const checkScale = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 10, stiffness: 160 } });
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [20, 50], [30, 0], { extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [45, 70], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: Math.max(0, frame - 120), fps, config: { damping: 14, stiffness: 120 } });
  const ctaOpacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: 'clamp' });

  const glowPulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Particle confetti */}
      {particleData.map((p, i) => {
        const elapsed = Math.max(0, frame - p.delay);
        const y = interpolate(elapsed, [0, 120], [0, 800], { extrapolateRight: 'clamp' });
        const particleOpacity = interpolate(elapsed, [0, 10, 80, 120], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
        const rotation = elapsed * p.speed * 4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: -20 + y,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              opacity: particleOpacity,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}

      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,107,0,${glowPulse * 0.15}) 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Check mark + logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${checkScale})`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l5.5 5.5L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 32 }}>
          Gesti<span style={{ color: '#FF6B00' }}>OS</span>
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 60,
          fontWeight: 900,
          color: '#ffffff',
          margin: 0,
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: 1.1,
        }}
      >
        ¡Listo para{' '}
        <span
          style={{
            background: 'linear-gradient(90deg, #FF6B00, #FF9A3C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          crecer
        </span>
        !
      </h1>

      {/* Subtitle */}
      <p
        style={{
          opacity: subtitleOpacity,
          fontSize: 20,
          color: '#888',
          margin: '16px 0 40px',
          textAlign: 'center',
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        Únete a cientos de negocios bolivianos que ya gestionan su empresa con GestiOS
      </p>

      {/* Feature pills */}
      <div
        style={{
          opacity: subtitleOpacity,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          maxWidth: 680,
          marginBottom: 48,
        }}
      >
        {FEATURES.map((f, i) => {
          const featureOpacity = interpolate(frame, [70 + i * 8, 90 + i * 8], [0, 1], { extrapolateRight: 'clamp' });
          const featureY = interpolate(frame, [70 + i * 8, 90 + i * 8], [10, 0], { extrapolateRight: 'clamp' });
          return (
            <div
              key={f.label}
              style={{
                opacity: featureOpacity,
                transform: `translateY(${featureY}px)`,
                padding: '8px 16px',
                borderRadius: 100,
                border: '1px solid #222',
                background: '#111',
                color: '#ccc',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </div>
          );
        })}
      </div>

      {/* CTA button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
            color: 'white',
            padding: '20px 56px',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 22,
            cursor: 'pointer',
            boxShadow: `0 0 40px rgba(255,107,0,${glowPulse * 0.6})`,
          }}
        >
          Pruébalo gratis — 7 días
        </div>
        <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
          Sin tarjeta de crédito · Sin contrato · Cancela cuando quieras
        </p>
        <p style={{ color: '#FF6B00', fontSize: 14, fontWeight: 600, margin: 0 }}>
          gestios.app
        </p>
      </div>
    </div>
  );
};
