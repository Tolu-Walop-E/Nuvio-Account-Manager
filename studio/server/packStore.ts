type StoredPack = {
  id: string
  body: string
  createdAt: number
}

const TTL_MS = 1000 * 60 * 60 * 24

const globalStore = globalThis as typeof globalThis & {
  __reframeViewPacks?: Map<string, StoredPack>
}

function store() {
  if (!globalStore.__reframeViewPacks) {
    globalStore.__reframeViewPacks = new Map()
  }
  return globalStore.__reframeViewPacks
}

function purge() {
  const now = Date.now()
  for (const [id, pack] of store()) {
    if (now - pack.createdAt > TTL_MS) store().delete(id)
  }
}

export function saveLocalPack(body: string): string {
  purge()
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  store().set(id, { id, body, createdAt: Date.now() })
  return id
}

export function readLocalPack(id: string): string | null {
  purge()
  return store().get(id)?.body ?? null
}
