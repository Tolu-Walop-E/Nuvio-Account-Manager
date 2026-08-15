const SUPABASE_URL = (process.env.NEXT_PUBLIC_NUVIO_SUPABASE_URL ?? '').replace(/\/$/, '')
const SUPABASE_KEY = process.env.NEXT_PUBLIC_NUVIO_SUPABASE_ANON_KEY ?? ''
const ORIGIN_CLIENT_ID = 'reframe-account-mgr-web01'

function requireBackend() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_NUVIO_SUPABASE_URL or NEXT_PUBLIC_NUVIO_SUPABASE_ANON_KEY'
    )
  }
}

export interface NuvioAddon {
  id?: string; user_id?: string; profile_id: number
  url: string; name: string | null; enabled: boolean; sort_order: number
  created_at?: string; updated_at?: string
}
export interface NuvioPlugin {
  id?: string; user_id?: string; profile_id: number
  url: string; name: string | null; enabled: boolean; sort_order: number
  repo_type: string | null; created_at?: string; updated_at?: string
}
export interface NuvioProfile {
  id: string; user_id: string; profile_index: number; name: string
  avatar_color_hex: string; uses_primary_addons: boolean; uses_primary_plugins: boolean
  avatar_id: string | null; avatar_url?: string | null
  created_at: string; updated_at: string
}
export interface AuthResult {
  access_token: string; refresh_token: string; user: { id: string; email: string }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  requireBackend()
  const url = `${SUPABASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    const message =
      body?.message ||
      body?.msg ||
      body?.error_description ||
      body?.hint ||
      `HTTP ${res.status}`
    throw new Error(typeof message === 'string' ? message : `HTTP ${res.status}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function withOrigin<T extends Record<string, unknown>>(body: T) {
  return { ...body, p_origin_client_id: ORIGIN_CLIENT_ID }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  return apiFetch('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
}

export async function getProfiles(token: string): Promise<NuvioProfile[]> {
  const rows = await apiFetch('/rest/v1/rpc/sync_pull_profiles', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({}),
  })
  return Array.isArray(rows) ? rows : []
}

export async function getAddons(token: string, profileId: number): Promise<NuvioAddon[]> {
  const result = await apiFetch(
    `/rest/v1/addons?select=*&profile_id=eq.${profileId}&order=sort_order`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return Array.isArray(result) ? result : []
}

export async function getPlugins(token: string, profileId: number): Promise<NuvioPlugin[]> {
  const result = await apiFetch(
    `/rest/v1/plugins?select=*&profile_id=eq.${profileId}&order=sort_order`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return Array.isArray(result) ? result : []
}

export async function getCollections(token: string, profileId: number): Promise<unknown[] | null> {
  const rows = await apiFetch('/rest/v1/rpc/sync_pull_collections', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ p_profile_id: profileId }),
  })
  const raw = Array.isArray(rows) ? rows?.[0]?.collections_json : rows?.collections_json
  if (!raw) return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return Array.isArray(raw) ? raw : null
}

export async function getWatchProgress(token: string, profileId: number): Promise<unknown[]> {
  const rows = await apiFetch('/rest/v1/rpc/sync_pull_watch_progress', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ p_profile_id: profileId }),
  })
  return Array.isArray(rows) ? rows : []
}

export async function getWatchHistory(token: string, profileId: number): Promise<unknown[]> {
  const rows = await apiFetch('/rest/v1/rpc/sync_pull_watched_items', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ p_profile_id: profileId, p_page: 1, p_page_size: 100000 }),
  })
  return Array.isArray(rows) ? rows : []
}

export async function getLibrary(token: string, profileId: number): Promise<unknown[]> {
  const rows = await apiFetch('/rest/v1/rpc/sync_pull_library', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ p_profile_id: profileId, p_limit: 500, p_offset: 0 }),
  })
  return Array.isArray(rows) ? rows : []
}

export async function pushAddons(token: string, profileId: number,
  addons: Pick<NuvioAddon, 'url' | 'name' | 'enabled' | 'sort_order'>[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_addons', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_addons: addons })),
  })
}

export async function pushPlugins(token: string, profileId: number,
  plugins: Pick<NuvioPlugin, 'url' | 'name' | 'enabled' | 'sort_order' | 'repo_type'>[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_plugins', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_plugins: plugins })),
  })
}

export async function pushCollections(token: string, profileId: number, collections: unknown[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_collections', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_collections_json: collections })),
  })
}

export async function pushWatchProgress(token: string, profileId: number, entries: unknown[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_watch_progress', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_entries: entries })),
  })
}

export async function pushWatchHistory(token: string, profileId: number, items: unknown[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_watched_items', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_items: items })),
  })
}

export async function pushLibrary(token: string, profileId: number, items: unknown[]): Promise<void> {
  await apiFetch('/rest/v1/rpc/sync_push_library_items', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({ p_profile_id: profileId, p_items: items })),
  })
}

export async function updateProfile(
  token: string,
  profileId: number,
  name: string
): Promise<void> {
  const profiles = await getProfiles(token)
  if (!profiles.length) {
    throw new Error('No profiles found for this account')
  }
  const payload = profiles.map((profile) => ({
    profile_index: profile.profile_index,
    name: profile.profile_index === profileId ? name : profile.name,
    avatar_color_hex: profile.avatar_color_hex,
    uses_primary_addons: profile.uses_primary_addons,
    uses_primary_plugins: profile.uses_primary_plugins,
    avatar_id: profile.avatar_id,
    avatar_url: profile.avatar_url ?? null,
  }))
  await apiFetch('/rest/v1/rpc/sync_push_profiles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(withOrigin({
      p_client_max_profiles: 6,
      p_profiles: payload,
    })),
  })
}
