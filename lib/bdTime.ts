const BD_OFFSET = 6 * 60; // Bangladesh UTC+6, no DST

function toBD(date: Date): Date {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000 + BD_OFFSET * 60000);
}

// Returns today's 00:00:00.000 in Asia/Dhaka as a UTC ISO string
export function getBDStartOfDay(): string {
  const bd = toBD(new Date());
  bd.setHours(0, 0, 0, 0);
  return new Date(bd.getTime() - BD_OFFSET * 60000).toISOString();
}

// Returns today's 23:59:59.999 in Asia/Dhaka as a UTC ISO string
export function getBDEndOfDay(): string {
  const bd = toBD(new Date());
  bd.setHours(23, 59, 59, 999);
  return new Date(bd.getTime() - BD_OFFSET * 60000).toISOString();
}

// Returns current time in BD as UTC ISO string
export function getBDNow(): Date {
  return toBD(new Date());
}
