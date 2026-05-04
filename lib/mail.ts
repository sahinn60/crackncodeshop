const RESEND_API_KEY = process.env.RESEND_API_KEY;
const IS_CONFIGURED = RESEND_API_KEY && !RESEND_API_KEY.startsWith('re_xxx');

export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // Dev fallback: log link to console when email is not configured
  if (!IS_CONFIGURED) {
    console.log('\n========== PASSWORD RESET ==========');
    console.log(`Email: ${to}`);
    console.log(`Link:  ${resetUrl}`);
    console.log('====================================\n');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CrackncodePremium <onboarding@resend.dev>',
      to,
      subject: 'Reset Your Password — CrackncodePremium',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#111;margin-bottom:8px;">Reset Your Password</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#E63030;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Reset Password
          </a>
          <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Resend API error:', res.status, body);
    throw new Error(body?.message || `Resend API returned ${res.status}`);
  }
}
