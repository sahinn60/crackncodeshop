import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// In-memory cache — settings rarely change
let cache: { data: any; expiresAt: number } | null = null;

function formatSettings(s: any) {
  return {
    siteName: s.siteName,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    heroBannerUrl: s.heroBannerUrl,
    bannerImages: (() => { try { return JSON.parse(s.bannerImages); } catch { return []; } })(),
    facebookPixelId: s.facebookPixelId,
    tiktokPixelId: s.tiktokPixelId,
    tawktoScriptUrl: s.tawktoScriptUrl,
    socialLinks: { twitter: s.socialTwitter, facebook: s.socialFacebook, instagram: s.socialInstagram },
  };
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  const s = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  const data = formatSettings(s);
  cache = { data, expiresAt: Date.now() + 60_000 };

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const updated = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      siteName: body.siteName,
      logoUrl: body.logoUrl,
      faviconUrl: body.faviconUrl,
      heroBannerUrl: body.heroBannerUrl,
      bannerImages: body.bannerImages ? JSON.stringify(body.bannerImages) : undefined,
      facebookPixelId: body.facebookPixelId,
      tiktokPixelId: body.tiktokPixelId,
      tawktoScriptUrl: body.tawktoScriptUrl,
      socialTwitter: body.socialLinks?.twitter,
      socialFacebook: body.socialLinks?.facebook,
      socialInstagram: body.socialLinks?.instagram,
    },
    create: { id: 'singleton' },
  });

  // Invalidate cache
  const data = formatSettings(updated);
  cache = { data, expiresAt: Date.now() + 60_000 };

  return NextResponse.json(updated);
}
