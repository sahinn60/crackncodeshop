import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

// In-memory cache — settings rarely change
let cache: { data: any; expiresAt: number } | null = null;

function formatSettings(s: any) {
  return {
    siteName: s.siteName,
    tagline: s.tagline || 'Digital Solutions at Your Fingertips',
    seoDescription: s.seoDescription || '',
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    heroBannerUrl: s.heroBannerUrl,
    bannerImages: (() => { try { return JSON.parse(s.bannerImages); } catch { return []; } })(),
    facebookPixelId: s.facebookPixelId,
    tiktokPixelId: s.tiktokPixelId,
    tawktoScriptUrl: s.tawktoScriptUrl,
    footerLogoUrl: s.footerLogoUrl,
    footerDescription: s.footerDescription,
    socialLinks: { twitter: s.socialTwitter, facebook: s.socialFacebook, instagram: s.socialInstagram },
    whatsappNumber: s.whatsappNumber,
    youtubeChannel: s.youtubeChannel,
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
  const { error } = requireAdminOrSubAdmin(req, 'settings');
  if (error) return error;

  const body = await req.json();
  try {
    const updated = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        siteName: body.siteName ?? undefined,
        tagline: body.tagline ?? undefined,
        seoDescription: body.seoDescription ?? undefined,
        logoUrl: body.logoUrl ?? undefined,
        faviconUrl: body.faviconUrl ?? undefined,
        heroBannerUrl: body.heroBannerUrl ?? undefined,
        bannerImages: body.bannerImages ? JSON.stringify(body.bannerImages) : undefined,
        facebookPixelId: body.facebookPixelId ?? undefined,
        tiktokPixelId: body.tiktokPixelId ?? undefined,
        tawktoScriptUrl: body.tawktoScriptUrl ?? undefined,
        footerLogoUrl: body.footerLogoUrl ?? undefined,
        footerDescription: body.footerDescription ?? undefined,
        socialTwitter: body.socialLinks?.twitter ?? undefined,
        socialFacebook: body.socialLinks?.facebook ?? undefined,
        socialInstagram: body.socialLinks?.instagram ?? undefined,
        whatsappNumber: body.whatsappNumber ?? undefined,
        youtubeChannel: body.youtubeChannel ?? undefined,
      },
      create: { id: 'singleton' },
    });

  // Invalidate cache
  const data = formatSettings(updated);
  cache = { data, expiresAt: Date.now() + 60_000 };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Settings PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 });
  }
}
