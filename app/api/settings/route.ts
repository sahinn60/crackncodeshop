import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

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
  const s = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  const data = formatSettings(s);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

export async function PUT(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'settings');
  if (error) return error;

  const body = await req.json();
  try {
    const updateData: any = {};

    // Only include fields that are explicitly provided (not undefined)
    if (body.siteName !== undefined) updateData.siteName = body.siteName;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.faviconUrl !== undefined) updateData.faviconUrl = body.faviconUrl;
    if (body.heroBannerUrl !== undefined) updateData.heroBannerUrl = body.heroBannerUrl;
    if (body.bannerImages !== undefined) updateData.bannerImages = JSON.stringify(body.bannerImages);
    if (body.facebookPixelId !== undefined) updateData.facebookPixelId = body.facebookPixelId;
    if (body.tiktokPixelId !== undefined) updateData.tiktokPixelId = body.tiktokPixelId;
    if (body.tawktoScriptUrl !== undefined) updateData.tawktoScriptUrl = body.tawktoScriptUrl;
    if (body.footerLogoUrl !== undefined) updateData.footerLogoUrl = body.footerLogoUrl;
    if (body.footerDescription !== undefined) updateData.footerDescription = body.footerDescription;
    if (body.socialLinks?.twitter !== undefined) updateData.socialTwitter = body.socialLinks.twitter;
    if (body.socialLinks?.facebook !== undefined) updateData.socialFacebook = body.socialLinks.facebook;
    if (body.socialLinks?.instagram !== undefined) updateData.socialInstagram = body.socialLinks.instagram;
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber;
    if (body.youtubeChannel !== undefined) updateData.youtubeChannel = body.youtubeChannel;

    const updated = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });

    const data = formatSettings(updated);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Settings PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 });
  }
}
