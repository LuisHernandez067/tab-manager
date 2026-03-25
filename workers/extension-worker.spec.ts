import { handleCaptureRequest } from './extension-worker';

import { createChromeMock, createChromeStorageArea } from '../src/testing/chrome-api.mock';

function assignChromeMock(mock: Partial<typeof chrome>): void {
  globalThis.chrome = createChromeMock(mock);
}

function createChromeEvent<T extends (...args: never[]) => void>(): chrome.events.Event<T> {
  return {
    addListener: jasmine.createSpy('addListener'),
    hasListener: jasmine.createSpy('hasListener').and.returnValue(false),
    removeListener: jasmine.createSpy('removeListener'),
    hasListeners: jasmine.createSpy('hasListeners').and.returnValue(false),
    addRules: jasmine.createSpy('addRules'),
    getRules: jasmine.createSpy('getRules'),
    removeRules: jasmine.createSpy('removeRules'),
  } as unknown as chrome.events.Event<T>;
}

function createStorageGet(result: Record<string, string>): chrome.storage.StorageArea['get'] {
  return ((_: string | string[] | object | null | undefined, callback?: (items: Record<string, string>) => void) => {
    callback?.(result);
  }) as unknown as chrome.storage.StorageArea['get'];
}

function createChromeTab(overrides: Partial<chrome.tabs.Tab>): chrome.tabs.Tab {
  return {
    active: false,
    audible: false,
    autoDiscardable: true,
    discarded: false,
    groupId: -1,
    highlighted: false,
    id: 1,
    incognito: false,
    index: 0,
    mutedInfo: { muted: false },
    pinned: false,
    selected: false,
    status: 'complete',
    title: '',
    url: '',
    windowId: 1,
    ...overrides,
  };
}

describe('extension-worker handleCaptureRequest', () => {
  const originalChrome = createChromeMock((globalThis.chrome ?? {}) as Partial<typeof chrome>);

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  it('should capture the current window as a session without closing tabs', async () => {
    const removeSpy = jasmine.createSpy('remove');

    assignChromeMock({
      ...originalChrome,
      runtime: {
        ...originalChrome.runtime,
        lastError: undefined,
        onMessage: createChromeEvent(),
        onInstalled: createChromeEvent(),
      },
      commands: {
        ...originalChrome.commands,
        onCommand: createChromeEvent(),
      },
      storage: {
        ...originalChrome.storage,
        local: {
          ...createChromeStorageArea(),
          QUOTA_BYTES: originalChrome.storage.local.QUOTA_BYTES,
          get: createStorageGet({ captureScope: 'currentWindow' }),
          set: jasmine.createSpy('set') as unknown as chrome.storage.StorageArea['set'],
        } as typeof chrome.storage.local,
      },
      windows: {
        ...originalChrome.windows,
        getLastFocused: jasmine.createSpy('getLastFocused').and.resolveTo({ id: 10 }),
        getAll: jasmine.createSpy('getAll').and.resolveTo([]),
      },
      tabs: {
        ...originalChrome.tabs,
        query: jasmine.createSpy('query').and.resolveTo([
          createChromeTab({
            id: 1,
            url: 'https://developer.mozilla.org/',
            title: 'MDN',
            pinned: false,
            active: true,
          }),
        ]),
        remove: removeSpy,
      },
    });

    const result = await handleCaptureRequest({ type: 'CAPTURE', mode: 'session', currentWindowId: 10 });

    expect(result.captureMode).toBe('session');
    expect(result.scope).toBe('currentWindow');
    expect(result.sessionId).toBeDefined();
    expect(result.message).toContain('Dry run: 1 tabs would be closed.');
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('should capture all windows as a standalone batch when requested', async () => {
    assignChromeMock({
      ...originalChrome,
      runtime: {
        ...originalChrome.runtime,
        lastError: undefined,
        onMessage: createChromeEvent(),
        onInstalled: createChromeEvent(),
      },
      commands: {
        ...originalChrome.commands,
        onCommand: createChromeEvent(),
      },
      storage: {
        ...originalChrome.storage,
        local: {
          ...createChromeStorageArea(),
          QUOTA_BYTES: originalChrome.storage.local.QUOTA_BYTES,
          get: createStorageGet({ captureScope: 'allWindows' }),
          set: jasmine.createSpy('set') as unknown as chrome.storage.StorageArea['set'],
        } as typeof chrome.storage.local,
      },
      windows: {
        ...originalChrome.windows,
        getLastFocused: jasmine.createSpy('getLastFocused').and.resolveTo({ id: 10 }),
        getAll: jasmine.createSpy('getAll').and.resolveTo([
          {
            id: 10,
            tabs: [
              createChromeTab({ id: 1, url: 'https://github.com/', title: 'GitHub', pinned: false, active: true }),
              createChromeTab({ id: 2, url: 'https://example.com/', title: 'Example', pinned: false, active: false }),
            ],
          },
          {
            id: 11,
            tabs: [
              createChromeTab({ id: 3, url: 'https://angular.dev/', title: 'Angular', pinned: false, active: false }),
            ],
          },
        ]),
      },
      tabs: {
        ...originalChrome.tabs,
        query: jasmine.createSpy('query').and.resolveTo([]),
        remove: jasmine.createSpy('remove'),
      },
    });

    const result = await handleCaptureRequest({
      type: 'CAPTURE',
      mode: 'tabs',
      tabIds: [1, 3],
      currentWindowId: 10,
    });

    expect(result.captureMode).toBe('tabs');
    expect(result.scope).toBe('allWindows');
    expect(result.sessionId).toBeUndefined();
    expect(result.standaloneGroupId).toBeDefined();
    expect(result.tabCount).toBe(2);
  });

  it('should capture all windows as a session when scope is persisted that way', async () => {
    assignChromeMock({
      ...originalChrome,
      runtime: {
        ...originalChrome.runtime,
        lastError: undefined,
        onMessage: createChromeEvent(),
        onInstalled: createChromeEvent(),
      },
      commands: {
        ...originalChrome.commands,
        onCommand: createChromeEvent(),
      },
      storage: {
        ...originalChrome.storage,
        local: {
          ...createChromeStorageArea(),
          QUOTA_BYTES: originalChrome.storage.local.QUOTA_BYTES,
          get: createStorageGet({ captureScope: 'allWindows' }),
          set: jasmine.createSpy('set') as unknown as chrome.storage.StorageArea['set'],
        } as typeof chrome.storage.local,
      },
      windows: {
        ...originalChrome.windows,
        getLastFocused: jasmine.createSpy('getLastFocused').and.resolveTo({ id: 10 }),
        getAll: jasmine.createSpy('getAll').and.resolveTo([
          {
            id: 10,
            tabs: [createChromeTab({ id: 1, url: 'https://developer.mozilla.org/', title: 'MDN' })],
          },
          {
            id: 11,
            tabs: [createChromeTab({ id: 2, url: 'https://github.com/', title: 'GitHub' })],
          },
        ]),
      },
      tabs: {
        ...originalChrome.tabs,
        query: jasmine.createSpy('query').and.resolveTo([]),
        remove: jasmine.createSpy('remove'),
      },
    });

    const result = await handleCaptureRequest({ type: 'CAPTURE', mode: 'session', currentWindowId: 10 });

    expect(result.captureMode).toBe('session');
    expect(result.scope).toBe('allWindows');
    expect(result.sessionId).toBeDefined();
    expect(result.standaloneGroupId).toBeUndefined();
    expect(result.tabCount).toBe(2);
  });
});
