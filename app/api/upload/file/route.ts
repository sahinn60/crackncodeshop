import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrSubAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const { error } = requireAdminOrSubAdmin(req);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (file.size > 100 * 1024 * 1024)
      return NextResponse.json({ error: 'File too large. Max 100MB.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'file';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const uploadDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // Return the internal download path (served via /api/download/file/[filename])
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const fileUrl = `${origin}/api/download/file/${uniqueName}`;

    return NextResponse.json({ url: fileUrl, filename: uniqueName });
  } catch (err: any) {
    console.error('[upload/file] Error:', err?.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
