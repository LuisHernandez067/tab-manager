import type { CaptureScope } from '@app/shared/models';

export const CAPTURE_SCOPE_STORAGE_KEY = 'captureScope';
export const DEFAULT_CAPTURE_SCOPE: CaptureScope = 'currentWindow';

type StorageGet = Pick<chrome.storage.StorageArea, 'get'>;
type StorageSet = Pick<chrome.storage.StorageArea, 'set'>;

function normalizeCaptureScope(value: unknown): CaptureScope {
  return value === 'allWindows' ? 'allWindows' : DEFAULT_CAPTURE_SCOPE;
}

export async function readCaptureScope(storageArea: StorageGet): Promise<CaptureScope> {
  return new Promise<CaptureScope>((resolve, reject) => {
    storageArea.get(CAPTURE_SCOPE_STORAGE_KEY, (items) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve(normalizeCaptureScope(items[CAPTURE_SCOPE_STORAGE_KEY]));
    });
  });
}

export async function writeCaptureScope(
  storageArea: StorageSet,
  scope: CaptureScope,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    storageArea.set({ [CAPTURE_SCOPE_STORAGE_KEY]: scope }, () => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve();
    });
  });
}
