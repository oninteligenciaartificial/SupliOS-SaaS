import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene1Welcome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [15, 45], [30, 0], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [40, 70], [20, 0], { extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [65, 95], [0, 1], { extrapolateRight: 'clamp' });
  const glowOpacity = interpolate(frame, [0, 60, 150], [0, 0.6, 0.3], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)',
          opacity: glowOpacity,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="6" width="10" height="10" rx="2" fill="white" />
            <rect x="20" y="6" width="10" height="10" rx="2" fill="white" opacity="0.7" />
            <rect x="6" y="20" width="10" height="10" rx="2" fill="white" opacity="0.7" />
            <rect x="20" y="20" width="10" height="10" rx="2" fill="white" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-1px',
          }}
        >
          Gesti<span style={{ color: '#FF6B00' }}>OS</span>
        </span>
      </div>

      {/* Main title */}
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 64,
          fontWeight: 800,
          color: '#ffffff',
          margin: 0,
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: 1.1,
        }}
      >
        Bienvenido a{' '}
        <span
          style={{
            background: 'linear-gradient(90deg, #FF6B00, #FF9A3C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GestiOS
        </span>
      </h1>

      {/* Tagline */}
      <p
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 24,
          color: '#999999',
          margin: '16px 0 0',
          textAlign: 'center',
          fontWeight: 400,
          maxWidth: 600,
        }}
      >
        El sistema de gestión empresarial diseñado para Bolivia
      </p>

      {/* Subtitle pills */}
      <div
        style={{
          opacity: subtitleOpacity,
          display: 'flex',
          gap: 12,
          marginTop: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {['Inventario', 'Ventas POS', 'Reportes', 'Facturación SIAT'].map((label) => (
          <div
            key={label}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              border: '1px solid rgba(255,107,0,0.4)',
              color: '#FF6B00',
              fontSize: 14,
              fontWeight: 600,
              background: 'rgba(255,107,0,0.08)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};
