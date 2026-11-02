export function normalizePhoneNumber(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

export function clampCapacity(value: number, min = 1, max = 12) {
  return Math.min(Math.max(value, min), max);
}
