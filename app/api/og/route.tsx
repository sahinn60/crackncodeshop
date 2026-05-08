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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          position: 'relative',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,45,45,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(13,110,253,0.08) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FF2D2D, #FF6B35, #0D6EFD)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '60px',
          }}
        >
          {/* Brand name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0px',
            }}
          >
            <span
              style={{
                fontSize: '72px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
              }}
            >
              Crackncode
            </span>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 800,
                color: '#FF2D2D',
                letterSpacing: '-0.03em',
              }}
            >
              .
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.01em',
              display: 'flex',
            }}
          >
            We Build Digital Growth Systems
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Web</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,45,45,0.6)' }}>•</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Marketing</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,45,45,0.6)' }}>•</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Growth</span>
          </div>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            crackncodepremium.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
