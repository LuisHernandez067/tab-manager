type ChromeStorageState = Record<string, unknown>;

const nativeChrome = globalThis.chrome;

function cloneRecord(source: ChromeStorageState): ChromeStorageState {
  return { ...source };
}

function resolveStorageGetResult(
  state: ChromeStorageState,
  keys: string | string[] | object | null | undefined,
): ChromeStorageState {
  if (keys === undefined || keys === null) {
    return cloneRecord(state);
  }

  if (typeof keys === 'string') {
    return { [keys]: state[keys] };
  }

  if (Array.isArray(keys)) {
    return keys.reduce<ChromeStorageState>((result, key) => {
      result[key] = state[key];
      return result;
    }, {});
  }

  return Object.entries(keys).reduce<ChromeStorageState>((result, [key, defaultValue]) => {
    result[key] = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : defaultValue;
    return result;
  }, {});
}

export function createChromeStorageArea(initialState: ChromeStorageState = {}): chrome.storage.StorageArea {
  const state = cloneRecord(initialState);
  const get: chrome.storage.StorageArea['get'] = ((keys, callback) => {
    const result = resolveStorageGetResult(
      state,
      keys as string | string[] | object | null | undefined,
    );
    (callback as ((items: ChromeStorageState) => void) | undefined)?.(result);
    return Promise.resolve(result) as unknown as void;
  }) as chrome.storage.StorageArea['get'];

  const getBytesInUse: chrome.storage.StorageArea['getBytesInUse'] = ((_, callback) => {
    callback?.(0);
    return Promise.resolve(0) as unknown as void;
  }) as chrome.storage.StorageArea['getBytesInUse'];

  const set: chrome.storage.StorageArea['set'] = ((items, callback) => {
    Object.assign(state, items as ChromeStorageState);
    callback?.();
    return Promise.resolve() as unknown as void;
  }) as chrome.storage.StorageArea['set'];

  const remove: chrome.storage.StorageArea['remove'] = ((keys, callback) => {
    const keysToRemove = Array.isArray(keys)
      ? keys.map((key) => String(key))
      : [String(keys)];

    for (const key of keysToRemove) {
      delete state[key];
    }

    callback?.();
    return Promise.resolve() as unknown as void;
  }) as chrome.storage.StorageArea['remove'];

  const clear: chrome.storage.StorageArea['clear'] = ((callback) => {
    for (const key of Object.keys(state)) {
      delete state[key];
    }

    callback?.();
    return Promise.resolve() as unknown as void;
  }) as chrome.storage.StorageArea['clear'];

  return {
    get,
    getBytesInUse,
    set,
    remove,
    clear,
  } as chrome.storage.StorageArea;
}

export function createChromeMock(overrides: Partial<typeof chrome> = {}): typeof chrome {
  const runtimeOverrides = (overrides.runtime ?? {}) as Partial<typeof chrome.runtime>;
  const storageOverrides = (overrides.storage ?? {}) as Partial<typeof chrome.storage>;
  const localOverrides = (storageOverrides.local ?? {}) as Partial<chrome.storage.StorageArea>;
  const windowsOverrides = (overrides.windows ?? {}) as Partial<typeof chrome.windows>;
  const baseStorageArea = createChromeStorageArea();
  const storage = {
    ...storageOverrides,
    local: {
      ...baseStorageArea,
      ...localOverrides,
    } as chrome.storage.StorageArea,
  } as typeof chrome.storage;

  return {
    ...overrides,
    runtime: {
      lastError: undefined,
      getURL: (path: string) => `chrome-extension://test/${path.replace(/^\//, '')}`,
      sendMessage: ((_: unknown, callback?: (response?: unknown) => void) => {
        callback?.({ success: true });
      }) as typeof chrome.runtime.sendMessage,
      ...runtimeOverrides,
    } as typeof chrome.runtime,
    storage,
    windows: {
      getCurrent: jasmine
        .createSpy('chrome.windows.getCurrent')
        .and.resolveTo({ id: 1 } as chrome.windows.Window),
      ...windowsOverrides,
    } as typeof chrome.windows,
  } as typeof chrome;
}

export function installChromeMock(overrides: Partial<typeof chrome> = {}): typeof chrome {
  const mock = createChromeMock(overrides);
  globalThis.chrome = mock;
  return mock;
}

export function restoreNativeChrome(): void {
  globalThis.chrome = nativeChrome;
}
