import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let siteName = 'Crackncodepremium';
  let tagline = 'Digital Solutions at Your Fingertips';

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    if (settings?.siteName) siteName = settings.siteName;
    if (settings?.tagline) tagline = settings.tagline;
  } catch {}

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
          background: 'linear-gradient(145deg, #080D19 0%, #0E1629 30%, #111B33 60%, #0A1020 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow - top left */}
        <div style={{ position: 'absolute', top: '-15%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,45,0.12) 0%, rgba(255,45,45,0.04) 40%, transparent 70%)', display: 'flex' }} />

        {/* Ambient glow - bottom right */}
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)', display: 'flex' }} />

        {/* Center glow behind text */}
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '200px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)', display: 'flex' }} />

        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent 5%, #FF2D2D 20%, #FF6B35 50%, #3B82F6 80%, transparent 95%)', display: 'flex' }} />

        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '80px 80px', display: 'flex' }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', position: 'relative', padding: '0 60px' }}>

          {/* Brand name */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '62px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.035em', lineHeight: 1 }}>
              {siteName}
            </span>
          </div>

          {/* Accent divider */}
          <div style={{ width: '64px', height: '3px', borderRadius: '4px', background: 'linear-gradient(90deg, #FF2D2D, #FF8C42)', display: 'flex' }} />

          {/* Tagline */}
          <div style={{ fontSize: '26px', fontWeight: 400, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.01em', display: 'flex', textAlign: 'center' }}>
            {tagline}
          </div>
        </div>

        {/* Bottom domain badge */}
        <div style={{ position: 'absolute', bottom: '34px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 18px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.4)', display: 'flex' }} />
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.03em' }}>
              crackncodepremium.com
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
