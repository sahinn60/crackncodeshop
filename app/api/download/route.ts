import { NextRequest, NextResponse } from 'next/server';

// Legacy route — download now handled via /api/download/generate + /api/download/file/[filename]
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'This download link has expired. Please go to your dashboard to download.' },
    { status: 410 }
  );
}
