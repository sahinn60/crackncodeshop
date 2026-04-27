import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function getOrCreateSettings() {
  return prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

export async function GET() {
  const s = await getOrCreateSettings();
  return NextResponse.json({
    siteName: s.siteName,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    heroBannerUrl: s.heroBannerUrl,
    bannerImages: (() => { try { return JSON.parse(s.bannerImages); } catch { return []; } })(),
    facebookPixelId: s.facebookPixelId,
    tiktokPixelId: s.tiktokPixelId,
    tawktoScriptUrl: s.tawktoScriptUrl,
    socialLinks: { twitter: s.socialTwitter, facebook: s.socialFacebook, instagram: s.socialInstagram },
  });
}

export async function PUT(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const data = await req.json();
  const updated = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      siteName: data.siteName,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      heroBannerUrl: data.heroBannerUrl,
      bannerImages: data.bannerImages ? JSON.stringify(data.bannerImages) : undefined,
      facebookPixelId: data.facebookPixelId,
      tiktokPixelId: data.tiktokPixelId,
      tawktoScriptUrl: data.tawktoScriptUrl,
      socialTwitter: data.socialLinks?.twitter,
      socialFacebook: data.socialLinks?.facebook,
      socialInstagram: data.socialLinks?.instagram,
    },
    create: { id: 'singleton' },
  });
  return NextResponse.json(updated);
}
