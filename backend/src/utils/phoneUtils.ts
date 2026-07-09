export function maskPhone(phone: string): string {
  if (phone.length < 8) return '***';
  return `${phone.slice(0, 3)}*****${phone.slice(-4)}`;
}

export function normalizeWhatsAppPhone(from: string): string {
  const trimmed = from.replace(/^whatsapp:/i, '').trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
