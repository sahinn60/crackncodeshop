import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const name = req.nextUrl.searchParams.get('name') || 'download';

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    const fileRes = await fetch(url);

    if (!fileRes.ok) {
      console.error('[download/proxy] Failed:', fileRes.status, url);
      return NextResponse.json(
        { error: 'File is not accessible. The admin needs to re-upload this file.' },
        { status: 502 }
      );
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileRes.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    return new NextResponse(fileRes.body, { status: 200, headers });
  } catch (err: any) {
    console.error('[download/proxy] Error:', err?.message);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
