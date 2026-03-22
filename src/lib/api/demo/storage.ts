const memoryStorage = new Map<string, string>();

function getStorage() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStorage.set(key, value);
      },
      removeItem: (key: string) => {
        memoryStorage.delete(key);
      },
    };
  }

  return window.localStorage;
}

export function readJsonStorage<T>(key: string, fallback: T) {
  const rawValue = getStorage().getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key: string, value: unknown) {
  getStorage().setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: string) {
  getStorage().removeItem(key);
}

export function createDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
