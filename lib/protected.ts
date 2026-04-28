const PROTECTED_EMAILS = [
  'armantamim47@gmail.com',
  'admin@crackncode.shop',
];

export function isProtectedUser(email: string): boolean {
  return PROTECTED_EMAILS.includes(email.toLowerCase());
}
