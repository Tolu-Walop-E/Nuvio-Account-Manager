import { slugify, withComputedCanvas, type ViewPack } from "../types/viewPack";
import {
  mergeSavedLayouts,
  pullSavedLayoutsFromAccount,
  pushSavedLayoutsToAccount,
} from "../nuvio/savedLayoutsCloud";
import { defaultConfig } from "../nuvio/config";
import type { NuvioSession } from "../nuvio/types";

const STORAGE_KEY = "nuvio.reframe.studio.savedViews.v1";

export type SavedView = {
  id: string;
  name: string;
  pack: ViewPack;
  updatedAt: number;
  createdAt: number;
};

export type SavedViewScope = {
  userId: string;
  profileId: number;
};

function scopeKey(scope: SavedViewScope): string {
  return `${STORAGE_KEY}:${scope.userId}:p${scope.profileId}`;
}

function readAll(storageKey: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v.id === "string" && v.pack)
      .map((v) => ({
        ...v,
        pack: withComputedCanvas(v.pack),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function writeAll(storageKey: string, views: SavedView[]) {
  localStorage.setItem(storageKey, JSON.stringify(views));
}

/** Old unscoped list belonged to profile 1 of the first account that opens Studio. */
function migrateLegacyIfNeeded(scope: SavedViewScope) {
  if (scope.profileId !== 1) return;
  const scoped = scopeKey(scope);
  if (localStorage.getItem(scoped)) return;
  const legacy = readAll(STORAGE_KEY);
  if (legacy.length === 0) return;
  writeAll(scoped, legacy);
}

function keyFor(scope?: SavedViewScope | null): string {
  if (!scope?.userId || !scope.profileId) return STORAGE_KEY;
  migrateLegacyIfNeeded(scope);
  return scopeKey(scope);
}

export function listSavedViews(scope?: SavedViewScope | null): SavedView[] {
  return readAll(keyFor(scope));
}

export function replaceSavedViews(views: SavedView[], scope?: SavedViewScope | null): void {
  writeAll(keyFor(scope), views);
}

/**
 * Pull cloud layouts for this profile, merge with browser cache, push if local had newer copies.
 * Survives browser clears / new devices once signed in.
 */
export async function syncSavedViewsWithAccount(
  session: NuvioSession,
  scope: SavedViewScope,
): Promise<SavedView[]> {
  const local = listSavedViews(scope);
  try {
    const remote = await pullSavedLayoutsFromAccount(defaultConfig(), session, scope.profileId);
    const merged = mergeSavedLayouts(local, remote);
    replaceSavedViews(merged, scope);
    const remoteSig = JSON.stringify(remote.map((v) => [v.id, v.updatedAt]));
    const mergedSig = JSON.stringify(merged.map((v) => [v.id, v.updatedAt]));
    if (remoteSig !== mergedSig) {
      await pushSavedLayoutsToAccount(defaultConfig(), session, scope.profileId, merged);
    }
    return merged;
  } catch {
    return local;
  }
}

async function pushLocalToAccount(
  session: NuvioSession | null | undefined,
  scope?: SavedViewScope | null,
) {
  if (!session || !scope?.userId || !scope.profileId) return;
  try {
    await pushSavedLayoutsToAccount(defaultConfig(), session, scope.profileId, listSavedViews(scope));
  } catch {
    /* keep browser copy; next sync retries */
  }
}

export function saveView(pack: ViewPack, name?: string, scope?: SavedViewScope | null): SavedView {
  const storageKey = keyFor(scope);
  const views = readAll(storageKey);
  const title = (name ?? pack.name ?? "Untitled view").trim() || "Untitled view";
  const id = slugify(title);
  const now = Date.now();
  const existing = views.find((v) => v.id === id);
  const entry: SavedView = {
    id,
    name: title,
    pack: withComputedCanvas({
      ...pack,
      id,
      name: title,
      schemaVersion: 1,
    }),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  writeAll(storageKey, [entry, ...views.filter((v) => v.id !== id)]);
  return entry;
}

export async function saveViewPersistent(
  pack: ViewPack,
  name: string | undefined,
  scope: SavedViewScope | null | undefined,
  session: NuvioSession | null | undefined,
): Promise<SavedView> {
  const entry = saveView(pack, name, scope);
  await pushLocalToAccount(session, scope);
  return entry;
}

export function loadSavedView(id: string, scope?: SavedViewScope | null): SavedView | null {
  return readAll(keyFor(scope)).find((v) => v.id === id) ?? null;
}

export function deleteSavedView(id: string, scope?: SavedViewScope | null): void {
  const storageKey = keyFor(scope);
  writeAll(
    storageKey,
    readAll(storageKey).filter((v) => v.id !== id),
  );
}

export async function deleteSavedViewPersistent(
  id: string,
  scope: SavedViewScope | null | undefined,
  session: NuvioSession | null | undefined,
): Promise<void> {
  deleteSavedView(id, scope);
  await pushLocalToAccount(session, scope);
}

export function renameSavedView(
  id: string,
  name: string,
  scope?: SavedViewScope | null,
): SavedView | null {
  const title = name.trim();
  if (!title) return null;
  const storageKey = keyFor(scope);
  const views = readAll(storageKey);
  const idx = views.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  const updated: SavedView = {
    ...views[idx],
    name: title,
    pack: withComputedCanvas({
      ...views[idx].pack,
      name: title,
    }),
    updatedAt: Date.now(),
  };
  const next = [...views];
  next[idx] = updated;
  writeAll(storageKey, next);
  return updated;
}
