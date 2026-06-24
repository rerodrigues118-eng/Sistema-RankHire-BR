export type CachedProfile = {
  id?: string;
  empresa_id?: string | null;
  nome?: string | null;
  email?: string | null;
  cargo?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  updated_at?: string | null;
};

const KEY = "rankhire.profile";

export function getCachedProfile(): CachedProfile | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedProfile;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: Partial<CachedProfile>) {
  try {
    if (typeof window === "undefined") return;
    const toStore: CachedProfile = {
      ...profile,
      updated_at: new Date().toISOString(),
    } as CachedProfile;
    localStorage.setItem(KEY, JSON.stringify(toStore));
  } catch {
    // noop
  }
}

export function clearCachedProfile() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
