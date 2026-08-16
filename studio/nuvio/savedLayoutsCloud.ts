import { rpc } from "./client";
import { getStudioSyncClientId } from "./syncClientId";
import type { NuvioConfig, NuvioSession } from "./types";
import type { SavedView } from "../views/savedViews";
import { withComputedCanvas } from "../types/viewPack";
import { parseViewPack } from "../demos";

/** Profile-settings platform key — separate from the TV app's `tv` blob. */
export const STUDIO_LAYOUTS_PLATFORM = "studio";

type SettingsBlob = {
  savedLayouts?: unknown;
};

type PullRow = {
  profile_id?: number;
  settings_json?: SettingsBlob | null;
  updated_at?: string;
};

function normalizeSavedView(raw: unknown): SavedView | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<SavedView>;
  if (typeof obj.id !== "string" || !obj.id.trim() || !obj.pack) return null;
  try {
    const pack = withComputedCanvas(parseViewPack(obj.pack));
    const now = Date.now();
    return {
      id: obj.id.trim(),
      name: (typeof obj.name === "string" && obj.name.trim()) || pack.name || obj.id,
      pack,
      createdAt: typeof obj.createdAt === "number" && Number.isFinite(obj.createdAt) ? obj.createdAt : now,
      updatedAt: typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt) ? obj.updatedAt : now,
    };
  } catch {
    return null;
  }
}

export function parseSavedLayoutsBlob(settings: unknown): SavedView[] {
  if (!settings || typeof settings !== "object") return [];
  const list = (settings as SettingsBlob).savedLayouts;
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeSavedView)
    .filter((v): v is SavedView => v != null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Merge local + cloud by id, keeping the newer updatedAt. */
export function mergeSavedLayouts(local: SavedView[], remote: SavedView[]): SavedView[] {
  const byId = new Map<string, SavedView>();
  for (const view of [...remote, ...local]) {
    const prev = byId.get(view.id);
    if (!prev || view.updatedAt >= prev.updatedAt) {
      byId.set(view.id, view);
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function pullSavedLayoutsFromAccount(
  config: NuvioConfig,
  session: NuvioSession,
  profileId: number,
): Promise<SavedView[]> {
  const rows = await rpc<PullRow[]>(config, session, "sync_pull_profile_settings_blob", {
    p_profile_id: profileId,
    p_platform: STUDIO_LAYOUTS_PLATFORM,
  });
  const row = Array.isArray(rows) ? rows[0] : null;
  return parseSavedLayoutsBlob(row?.settings_json ?? null);
}

export async function pushSavedLayoutsToAccount(
  config: NuvioConfig,
  session: NuvioSession,
  profileId: number,
  views: SavedView[],
): Promise<void> {
  await rpc(config, session, "sync_push_profile_settings_blob", {
    p_profile_id: profileId,
    p_platform: STUDIO_LAYOUTS_PLATFORM,
    p_settings_json: {
      savedLayouts: views.map((v) => ({
        id: v.id,
        name: v.name,
        pack: v.pack,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    },
    p_origin_client_id: getStudioSyncClientId(),
  });
}
