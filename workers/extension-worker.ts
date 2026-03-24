// Service Worker — Tab Manager MV3
//
// CONSTRAINTS:
// - Plain TypeScript. NO Angular, NO DOM APIs.
// - Dexie is instantiated directly (not via Angular DI).
// - All Chrome API calls are wrapped in try/catch.
// - Tabs are NEVER closed before persistence is confirmed.

import { TabManagerDB } from '../src/app/data/dexie/tab-manager-db';
import { mapChromeTabToSavedTab } from '../src/app/data/mappers/tab.mapper';
import type { SessionSnapshot } from '../src/app/shared/models';
import type {
  DeleteSessionRequest,
  PanicCaptureRequest,
  PanicCaptureResult,
  SessionCountResult,
  TabManagerRequest,
  TabManagerResponse,
} from '../src/app/core/messaging/tab-manager-message.types';

// ---------------------------------------------------------------------------
// Singleton DB instance — created once when the SW starts
// ---------------------------------------------------------------------------

const db = new TabManagerDB();

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
async function captureCurrentWindow(windowId?: number): Promise<PanicCaptureResult> {
  // 1. Resolve the target window
  const targetWindowId =
    windowId ?? (await chrome.windows.getCurrent()).id ?? chrome.windows.WINDOW_ID_CURRENT;

  // 2. Query all tabs in the target window
  const chromeTabs = await chrome.tabs.query({ windowId: targetWindowId });

  // 3. Build the snapshot id and name up-front (needed by mapper)
  const sessionId = crypto.randomUUID();
  const sessionName = `Session – ${new Date().toLocaleDateString()}`;

  // 4. Map each chrome.tabs.Tab → SavedTab
  const savedTabs = chromeTabs.map((tab, index) =>
    mapChromeTabToSavedTab(tab, sessionId, index),
  );

  // 5. Build the SessionSnapshot
  const snapshot: SessionSnapshot = {
    id: sessionId,
    createdAt: new Date(),
    updatedAt: new Date(),
    name: sessionName,
    status: 'active',
    tabCount: savedTabs.length,
    sourceWindowIds: [typeof targetWindowId === 'number' ? targetWindowId : 0],
    autoTags: [],
    manualTags: [],
  };

  // 6. Atomically persist snapshot + tabs
  //    If ANYTHING throws here, the transaction is rolled back.
  //    We re-throw so callers know not to close tabs.
  await db.transaction('rw', [db.sessions, db.tabs], async () => {
    await db.sessions.add(snapshot);
    await db.tabs.bulkAdd(savedTabs);
  });

  // 7. Persistence is confirmed — return result
  //    (tabs are NOT closed in Phase 1)
  return {
    sessionId,
    tabCount: savedTabs.length,
    sessionName,
  };
}

// ---------------------------------------------------------------------------
// T4.2 — Message listener (UI → SW)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: TabManagerRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: TabManagerResponse<unknown>) => void,
  ): boolean => {
    // Return `true` at the end to keep the message channel open for async reply.
    // Each case calls sendResponse exactly once, either on success or in catch.

    switch (message.type) {
      case 'PANIC_CAPTURE': {
        const req = message as PanicCaptureRequest;
        captureCurrentWindow(req.windowId)
          .then((result: PanicCaptureResult) => {
            sendResponse({ success: true, data: result });
          })
          .catch((err: unknown) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('[TabManager] PANIC_CAPTURE failed:', errorMessage);
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
    captureCurrentWindow()
      .then((result: PanicCaptureResult) => {
        console.info(
          `[TabManager] Capture complete via shortcut — session: ${result.sessionId}, tabs: ${result.tabCount}, name: "${result.sessionName}"`,
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
