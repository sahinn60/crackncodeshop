export interface ValidationError { field: string; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(data: { email?: unknown; password?: unknown }): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.email || typeof data.email !== 'string' || !EMAIL_RE.test(data.email))
    errors.push({ field: 'email', message: 'Enter a valid email address' });
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6)
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  return errors;
}

export function validateRegister(data: { name?: unknown; email?: unknown; password?: unknown }): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2)
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (!data.email || typeof data.email !== 'string' || !EMAIL_RE.test(data.email))
    errors.push({ field: 'email', message: 'Enter a valid email address' });
  if (!data.password || typeof data.password !== 'string' || data.password.length < 8)
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  if (typeof data.password === 'string' && !/[A-Z]/.test(data.password))
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  if (typeof data.password === 'string' && !/[0-9]/.test(data.password))
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  return errors;
}

export function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very Strong', color: 'bg-green-600' },
  ];
  return { score, ...levels[score] };
}
