import type { NuvioConfig, NuvioSession } from "./types";

const CONFIG_KEY = "nuvio_reframe_studio.config";
const SESSION_KEY = "nuvio_reframe_studio.session";
const PROFILE_KEY = "nuvio_reframe_studio.lastProfileId";

export function defaultConfig(): NuvioConfig {
  const fromEnv: NuvioConfig = {
    supabaseUrl: (process.env.NEXT_PUBLIC_NUVIO_SUPABASE_URL ?? "").trim(),
    anonKey: (process.env.NEXT_PUBLIC_NUVIO_SUPABASE_ANON_KEY ?? "").trim(),
  };
  const saved = loadConfig();
  return {
    supabaseUrl: saved.supabaseUrl || fromEnv.supabaseUrl,
    anonKey: saved.anonKey || fromEnv.anonKey,
  };
}

export function loadConfig(): NuvioConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { supabaseUrl: "", anonKey: "" };
    const parsed = JSON.parse(raw) as Partial<NuvioConfig>;
    return {
      supabaseUrl: String(parsed.supabaseUrl ?? "").trim(),
      anonKey: String(parsed.anonKey ?? "").trim(),
    };
  } catch {
    return { supabaseUrl: "", anonKey: "" };
  }
}

export function saveConfig(config: NuvioConfig) {
  localStorage.setItem(
    CONFIG_KEY,
    JSON.stringify({
      supabaseUrl: config.supabaseUrl.trim().replace(/\/$/, ""),
      anonKey: config.anonKey.trim(),
    }),
  );
}

export function loadSession(): NuvioSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NuvioSession;
    if (!parsed.accessToken || !parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: NuvioSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadLastStudioProfileId(userId: string): number {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}:${userId}`);
    const id = raw ? Number(raw) : 1;
    if (!Number.isInteger(id) || id < 1 || id > 6) return 1;
    return id;
  } catch {
    return 1;
  }
}

export function saveLastStudioProfileId(userId: string, profileId: number) {
  localStorage.setItem(`${PROFILE_KEY}:${userId}`, String(profileId));
}
