import { Injectable, signal } from '@angular/core';

import type { CaptureScope } from '@app/shared/models';

import { DEFAULT_CAPTURE_SCOPE, readCaptureScope, writeCaptureScope } from './capture-scope.storage';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly captureScope = signal<CaptureScope>(DEFAULT_CAPTURE_SCOPE);

  constructor() {
    void this.loadCaptureScope();
  }

  async loadCaptureScope(): Promise<CaptureScope> {
    const scope = await readCaptureScope(chrome.storage.local);
    this.captureScope.set(scope);
    return scope;
  }

  async setCaptureScope(scope: CaptureScope): Promise<void> {
    await writeCaptureScope(chrome.storage.local, scope);
    this.captureScope.set(scope);
  }
}
