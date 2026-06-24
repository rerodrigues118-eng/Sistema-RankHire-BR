type Entry = { code: string; newValue: string; expiresAt: number };
export const pendingChanges = new Map<string, Entry>();

export function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
