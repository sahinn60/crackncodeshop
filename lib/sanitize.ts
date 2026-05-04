// Strip HTML tags and dangerous characters from user input
export function sanitize(input: string, maxLength = 1000): string {
  return input
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip JS protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

// Sanitize for use in database text fields
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return sanitize(input, maxLength);
}

// Validate and sanitize email
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toLowerCase().trim().slice(0, 254);
}

// Validate positive number
export function sanitizeNumber(input: unknown, min = 0, max = 9999999): number {
  const num = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : NaN;
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}
