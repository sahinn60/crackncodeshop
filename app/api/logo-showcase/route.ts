import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

export interface LogoItem {
  id: string;
  image: string;
  alt: string;
  link?: string;
  active: boolean;
}

export interface LogoShowcaseConfig {
  title: string;
  subtitle: string;
  titleEffects: string[];
  logoAnimations: string[];
  speed: 'slow' | 'medium' | 'fast';
  pauseOnHover: boolean;
  logos: LogoItem[];
}

const DEFAULT_CONFIG: LogoShowcaseConfig = {
  title: 'Trusted by 5,000+ creators',
  subtitle: 'Used by professionals worldwide',
  titleEffects: ['glow-text'],
  logoAnimations: ['scroll'],
  speed: 'slow',
  pauseOnHover: true,
  logos: [],
};

let cache: { data: LogoShowcaseConfig; expiresAt: number } | null = null;

function normalize(raw: any): LogoShowcaseConfig {
  // Backward compat: old single-value fields → arrays
  let titleEffects = raw.titleEffects;
  if (!titleEffects && raw.titleEffect) titleEffects = [raw.titleEffect];
  let logoAnimations = raw.logoAnimations;
  if (!logoAnimations && raw.animationType) logoAnimations = [raw.animationType];

  return {
    title: raw.title ?? DEFAULT_CONFIG.title,
    subtitle: raw.subtitle ?? DEFAULT_CONFIG.subtitle,
    titleEffects: Array.isArray(titleEffects) ? titleEffects : DEFAULT_CONFIG.titleEffects,
    logoAnimations: Array.isArray(logoAnimations) ? logoAnimations : DEFAULT_CONFIG.logoAnimations,
    speed: raw.speed ?? DEFAULT_CONFIG.speed,
    pauseOnHover: raw.pauseOnHover ?? DEFAULT_CONFIG.pauseOnHover,
    logos: Array.isArray(raw.logos) ? raw.logos : [],
  };
}

export async function GET() {
  try {
    if (cache && Date.now() < cache.expiresAt) return NextResponse.json(cache.data);

    const row = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });

    let config = { ...DEFAULT_CONFIG };
    if (row.logoShowcase && row.logoShowcase !== '{}') {
      try { config = normalize(JSON.parse(row.logoShowcase)); } catch {}
    }

    cache = { data: config, expiresAt: Date.now() + 60_000 };
    return NextResponse.json(config);
  } catch (err: any) {
    console.error('[logo-showcase GET]', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = requireAdminOrSubAdmin(req, 'settings');
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const config = normalize(body);
    const json = JSON.stringify(config);

    await prisma.$executeRawUnsafe(
      `UPDATE "Settings" SET "logoShowcase" = $1 WHERE "id" = 'singleton'`,
      json
    );

    cache = { data: config, expiresAt: Date.now() + 60_000 };
    return NextResponse.json(config);
  } catch (err: any) {
    console.error('[logo-showcase PUT]', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
