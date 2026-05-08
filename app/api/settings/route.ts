import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSubAdmin } from '@/lib/auth';

function formatSettings(s: any) {
  return {
    siteName: s.siteName || 'CrackncodePremium',
    tagline: s.tagline || 'Digital Solutions at Your Fingertips',
    seoDescription: s.seoDescription || '',
    logoUrl: s.logoUrl || '',
    faviconUrl: s.faviconUrl || '',
    heroBannerUrl: s.heroBannerUrl || '',
    bannerImages: (() => { try { return JSON.parse(s.bannerImages || '[]'); } catch { return []; } })(),
    facebookPixelId: s.facebookPixelId || '',
    tiktokPixelId: s.tiktokPixelId || '',
    tawktoScriptUrl: s.tawktoScriptUrl || '',
    footerLogoUrl: s.footerLogoUrl || '',
    footerDescription: s.footerDescription || '',
    socialLinks: { twitter: s.socialTwitter || '', facebook: s.socialFacebook || '', instagram: s.socialInstagram || '' },
    whatsappNumber: s.whatsappNumber || '',
    youtubeChannel: s.youtubeChannel || '',
  };
}

export async function GET() {
  try {
    const s = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    return NextResponse.json(formatSettings(s));
  } catch (err: any) {
    console.error('Settings GET error:', err?.message);
    return NextResponse.json(formatSettings({}));
  }
}

export async function PUT(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req, 'settings');
  if (error) return error;

  const body = await req.json();

  try {
    const updateData: any = {};

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

    let updated;
    try {
      updated = await prisma.settings.upsert({
        where: { id: 'singleton' },
        update: updateData,
        create: { id: 'singleton', ...updateData },
      });
    } catch (dbErr: any) {
      // If error is about unknown columns (tagline/seoDescription not migrated yet),
      // retry without those fields
      console.error('Settings DB error, retrying without new fields:', dbErr?.message);
      delete updateData.tagline;
      delete updateData.seoDescription;
      updated = await prisma.settings.upsert({
        where: { id: 'singleton' },
        update: updateData,
        create: { id: 'singleton', ...updateData },
      });
    }

    return NextResponse.json(formatSettings(updated));
  } catch (err: any) {
    console.error('Settings PUT error:', err?.message, err?.stack);
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}
