import { Injectable } from '@angular/core';

import type { TabManagerRequest, TabManagerResponse } from './tab-manager-message.types';

/**
 * Thin wrapper around `chrome.runtime.sendMessage` that:
 *  - enforces the typed message contract
 *  - converts the callback API to a Promise
 *  - captures `chrome.runtime.lastError` (connection / context-invalidated errors)
 *  - never throws uncaught errors to callers — always resolves with `TabManagerResponse`
 */
@Injectable({ providedIn: 'root' })
export class MessageSenderService {
  /**
   * Send a typed request to the extension Service Worker.
   *
   * @param message - A `TabManagerRequest` discriminated-union member.
   * @returns A promise that always resolves.  On success: `{ success: true, data }`.
   *          On any error: `{ success: false, error: '<message>' }`.
   *
   * @example
   * const res = await sender.send<PanicCaptureRequest, PanicCaptureResult>(
   *   { type: 'PANIC_CAPTURE' }
   * );
   * if (res.success) console.log(res.data.sessionId);
   */
  async send<TReq extends TabManagerRequest, TData = void>(
    message: TReq,
  ): Promise<TabManagerResponse<TData>> {
    return new Promise<TabManagerResponse<TData>>((resolve) => {
      chrome.runtime.sendMessage(
        message,
        (response: TabManagerResponse<TData>) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message ?? 'Unknown error',
            });
            return;
          }
          resolve(response);
        },
      );
    });
  }
}
