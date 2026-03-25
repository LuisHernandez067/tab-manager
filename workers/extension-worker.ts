// Service Worker — Tab Manager MV3
//
// CONSTRAINTS:
// - Plain TypeScript. NO Angular, NO DOM APIs.
// - Dexie is instantiated directly (not via Angular DI).
// - All Chrome API calls are wrapped in try/catch.
// - Tabs are NEVER closed before persistence is confirmed.

import { TabManagerDB } from '../src/app/data/dexie/tab-manager-db';
import { mapChromeTabToSavedTab } from '../src/app/data/mappers/tab.mapper';
import {
  DEFAULT_CAPTURE_SCOPE,
  readCaptureScope,
} from '../src/app/core/settings/capture-scope.storage';

import type {
  CaptureRequest,
  CaptureResult,
  CaptureScope,
  DeleteSessionRequest,
  SessionCountResult,
  TabManagerRequest,
  TabManagerResponse,
} from '../src/app/core/messaging/tab-manager-message.types';
import type { CaptureMode, SessionSnapshot } from '../src/app/shared/models';

// ---------------------------------------------------------------------------
// Singleton DB instance — created once when the SW starts
// ---------------------------------------------------------------------------

const db = new TabManagerDB();

function isRuntimeAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.commands;
}

// ---------------------------------------------------------------------------
// T4.1 — Capture transaction flow
// ---------------------------------------------------------------------------

/**
 * Queries all tabs in the given window (or the current window if `windowId`
 * is omitted), maps them to `SavedTab` entities, and atomically persists both
 * the `SessionSnapshot` and its `SavedTab`s in a single Dexie transaction.
 *
 * Persistence invariant: if the transaction fails, this function throws and
 * tabs are NEVER removed. Callers must NOT call `chrome.tabs.remove` before
 * this resolves successfully.
 *
 * NOTE: Phase 1 does NOT close tabs after capture. That is a future feature.
 *
 * @throws If the Chrome API query fails or the Dexie transaction fails.
 */
async function resolveCaptureScope(): Promise<CaptureScope> {
  try {
    return await readCaptureScope(chrome.storage.local);
  } catch (error: unknown) {
    console.warn(
      '[TabManager] Failed to read capture scope, falling back to currentWindow:',
      error instanceof Error ? error.message : String(error),
    );
    return DEFAULT_CAPTURE_SCOPE;
  }
}

async function resolveCurrentWindowId(preferredWindowId?: number): Promise<number> {
  if (typeof preferredWindowId === 'number') {
    return preferredWindowId;
  }

  const lastFocused = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });

  if (typeof lastFocused.id === 'number') {
    return lastFocused.id;
  }

  throw new Error('Unable to resolve the current browser window.');
}

async function queryTabsForScope(
  scope: CaptureScope,
  currentWindowId?: number,
): Promise<{ tabs: chrome.tabs.Tab[]; sourceWindowIds: number[] }> {
  if (scope === 'allWindows') {
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
    const tabs = windows.flatMap((windowInfo) => windowInfo.tabs ?? []);
    const sourceWindowIds = windows
      .map((windowInfo) => windowInfo.id)
      .filter((windowId): windowId is number => typeof windowId === 'number');

    return { tabs, sourceWindowIds };
  }

  const resolvedWindowId = await resolveCurrentWindowId(currentWindowId);
  const tabs = await chrome.tabs.query({ windowId: resolvedWindowId });

  return {
    tabs,
    sourceWindowIds: [resolvedWindowId],
  };
}

function selectTabsForCapture(
  tabs: readonly chrome.tabs.Tab[],
  requestedTabIds?: readonly number[],
): chrome.tabs.Tab[] {
  if (!requestedTabIds || requestedTabIds.length === 0) {
    return [...tabs];
  }

  const requestedIds = new Set(requestedTabIds);
  return tabs.filter((tab) => typeof tab.id === 'number' && requestedIds.has(tab.id));
}

function buildSessionSnapshot(params: {
  sessionId: string;
  sourceWindowIds: number[];
  tabCount: number;
  captureMode: CaptureMode;
  scope: CaptureScope;
  capturedAt: Date;
}): SessionSnapshot {
  return {
    id: params.sessionId,
    createdAt: params.capturedAt,
    updatedAt: params.capturedAt,
    name: `Session – ${params.capturedAt.toLocaleDateString()}`,
    status: 'active',
    captureMode: params.captureMode,
    scope: params.scope,
    tabCount: params.tabCount,
    sourceWindowIds: params.sourceWindowIds,
    autoTags: [],
    manualTags: [],
  };
}

export async function handleCaptureRequest(request: CaptureRequest): Promise<CaptureResult> {
  const scope = await resolveCaptureScope();
  const { tabs, sourceWindowIds } = await queryTabsForScope(scope, request.currentWindowId);
  const selectedTabs = selectTabsForCapture(tabs, request.tabIds);

  if (selectedTabs.length === 0) {
    throw new Error('No tabs matched the requested capture scope.');
  }

  const capturedAt = new Date();
  const sessionId = request.mode === 'session' ? crypto.randomUUID() : undefined;
  const standaloneGroupId = request.mode === 'tabs' ? crypto.randomUUID() : undefined;
  const savedTabs = selectedTabs.map((tab, index) =>
    mapChromeTabToSavedTab(
      tab,
      {
        mode: request.mode,
        sessionId,
        standaloneGroupId,
        capturedAt,
      },
      index,
    ),
  );

  await db.transaction('rw', [db.sessions, db.tabs], async () => {
    if (sessionId) {
      const snapshot = buildSessionSnapshot({
        sessionId,
        sourceWindowIds,
        tabCount: savedTabs.length,
        captureMode: request.mode,
        scope,
        capturedAt,
      });

      await db.sessions.add(snapshot);
    }

    await db.tabs.bulkAdd(savedTabs);
  });

  return {
    captureMode: request.mode,
    scope,
    sessionId,
    standaloneGroupId,
    tabCount: savedTabs.length,
    dryRunClosedCount: savedTabs.length,
    message: `${savedTabs.length} tabs saved! (Dry run: ${savedTabs.length} tabs would be closed.)`,
  };
}

// ---------------------------------------------------------------------------
// T4.2 — Message listener (UI → SW)
// ---------------------------------------------------------------------------

if (isRuntimeAvailable()) {
  chrome.runtime.onMessage.addListener(
    (
      message: TabManagerRequest,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: TabManagerResponse<unknown>) => void,
    ): boolean => {
    // Return `true` at the end to keep the message channel open for async reply.
    // Each case calls sendResponse exactly once, either on success or in catch.

      switch (message.type) {
        case 'CAPTURE': {
          const req = message as CaptureRequest;
          handleCaptureRequest(req)
            .then((result: CaptureResult) => {
              sendResponse({ success: true, data: result });
            })
            .catch((err: unknown) => {
              const errorMessage = err instanceof Error ? err.message : String(err);
              console.error('[TabManager] CAPTURE failed:', errorMessage);
              sendResponse({ success: false, error: errorMessage });
            });
          break;
        }

        case 'GET_SESSION_COUNT': {
          db.sessions
            .count()
            .then((count: number) => {
              const result: SessionCountResult = { count };
              sendResponse({ success: true, data: result });
            })
            .catch((err: unknown) => {
              const errorMessage = err instanceof Error ? err.message : String(err);
              console.error('[TabManager] GET_SESSION_COUNT failed:', errorMessage);
              sendResponse({ success: false, error: errorMessage });
            });
          break;
        }

        case 'RESTORE_SESSION': {
          sendResponse({ success: false, error: 'Not implemented in Phase 1' });
          break;
        }

        case 'OPEN_DASHBOARD': {
          sendResponse({ success: false, error: 'Not implemented in Phase 1' });
          break;
        }

        case 'OPEN_SIDE_PANEL': {
          sendResponse({ success: false, error: 'Not implemented in Phase 1' });
          break;
        }

        case 'DELETE_SESSION': {
          const req = message as DeleteSessionRequest;
          db.transaction('rw', [db.sessions, db.tabs], async () => {
            await db.tabs.where('sessionId').equals(req.sessionId).delete();
            await db.sessions.delete(req.sessionId);
          })
            .then(() => {
              sendResponse({ success: true, data: undefined });
            })
            .catch((err: unknown) => {
              const errorMessage = err instanceof Error ? err.message : String(err);
              console.error('[TabManager] DELETE_SESSION failed:', errorMessage);
              sendResponse({ success: false, error: errorMessage });
            });
          break;
        }

        default: {
          // Exhaustiveness guard — unknown message type
          const exhaustive: never = message;
          console.warn('[TabManager] Unknown message type:', (exhaustive as TabManagerRequest).type);
          sendResponse({ success: false, error: 'Unknown message type' });
          break;
        }
      }

      // Return true to indicate an async response will be sent.
      return true;
    },
  );

  // ---------------------------------------------------------------------------
  // T4.2 — Keyboard shortcut listener
  // ---------------------------------------------------------------------------

  chrome.commands.onCommand.addListener((command: string) => {
    if (command === 'panic-capture') {
      handleCaptureRequest({ type: 'CAPTURE', mode: 'session' })
        .then((result: CaptureResult) => {
          console.info(
            `[TabManager] Capture complete via shortcut — session: ${result.sessionId ?? 'none'}, tabs: ${result.tabCount}, scope: ${result.scope}`,
          );
        })
        .catch((err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error('[TabManager] Shortcut capture failed:', errorMessage);
        });
    }
  });

  // ---------------------------------------------------------------------------
  // T4.2 — Extension lifecycle listener
  // ---------------------------------------------------------------------------

  chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    const manifest = chrome.runtime.getManifest();
    console.info(
      `[TabManager] Tab Manager installed — version ${manifest.version}, reason: ${details.reason}`,
    );
  });
}
