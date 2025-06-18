export function getUsernameFromEmail(email?: string | null): string {
  if (!email) return '';
  return email.split('@')[0];
} 