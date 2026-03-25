import { SettingsService } from './settings.service';

import { createChromeStorageArea, installChromeMock, restoreNativeChrome } from '../../../testing/chrome-api.mock';

function createStorageGet(result: Record<string, string>): chrome.storage.StorageArea['get'] {
  return ((_: string | string[] | object | null | undefined, callback?: (items: Record<string, string>) => void) => {
    callback?.(result);
  }) as unknown as chrome.storage.StorageArea['get'];
}

describe('SettingsService', () => {
  afterEach(() => {
    restoreNativeChrome();
  });

  it('should load persisted all-windows scope on construction', async () => {
    installChromeMock({
      runtime: {
        lastError: undefined,
        getURL: (path: string) => `chrome-extension://test/${path}`,
      } as unknown as typeof chrome.runtime,
      storage: {
        local: {
          ...createChromeStorageArea({ captureScope: 'allWindows' }),
          get: createStorageGet({ captureScope: 'allWindows' }),
          set: jasmine.createSpy('set') as unknown as chrome.storage.StorageArea['set'],
        } as chrome.storage.StorageArea,
      } as typeof chrome.storage,
    });

    const service = new SettingsService();
    await Promise.resolve();

    expect(service.captureScope()).toBe('allWindows');
  });

  it('should persist the selected capture scope', async () => {
    const setSpy = jasmine.createSpy('set').and.callFake(
      (_items: Record<string, string>, callback: VoidFunction) => {
        callback();
      },
    );

    installChromeMock({
      runtime: {
        lastError: undefined,
        getURL: (path: string) => `chrome-extension://test/${path}`,
      } as unknown as typeof chrome.runtime,
      storage: {
        local: {
          ...createChromeStorageArea(),
          get: createStorageGet({}),
          set: setSpy as unknown as chrome.storage.StorageArea['set'],
        } as chrome.storage.StorageArea,
      } as typeof chrome.storage,
    });

    const service = new SettingsService();
    await service.setCaptureScope('allWindows');

    expect(setSpy).toHaveBeenCalledWith({ captureScope: 'allWindows' }, jasmine.any(Function));
    expect(service.captureScope()).toBe('allWindows');
  });
});
