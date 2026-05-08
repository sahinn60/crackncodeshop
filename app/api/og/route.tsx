import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0F1C',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,45,45,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #FF2D2D 0%, #FF6B35 50%, #3B82F6 100%)',
            display: 'flex',
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px',
            position: 'relative',
          }}
        >
          {/* Brand logo text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0px',
            }}
          >
            <span
              style={{
                fontSize: '68px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Crackncode
            </span>
            <span
              style={{
                fontSize: '68px',
                fontWeight: 800,
                color: '#FF2D2D',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Premium
            </span>
          </div>

          {/* Divider line */}
          <div
            style={{
              width: '80px',
              height: '3px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #FF2D2D, #FF6B35)',
              display: 'flex',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: '30px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.01em',
              display: 'flex',
            }}
          >
            Digital Solutions at Your Fingertips
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Domain pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22C55E',
                display: 'flex',
              }}
            />
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '0.02em' }}>
              crackncodepremium.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
