/**
 * Favorites are stored in this browser only (localStorage). They are not shared
 * between devices or visitors.
 */
import { useCallback, useSyncExternalStore } from "react";

const KEY = "graduation-archive:favorites";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.ids;
  let ids: string[] = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    ids = EMPTY;
  }
  cache = { raw, ids };
  return ids;
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage full or blocked (private mode): favorites just won't persist.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);
  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, has, toggle, remove };
}
