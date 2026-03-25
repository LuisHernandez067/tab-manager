import type { CaptureMode, SavedTab } from '@app/shared/models';

import { categorizeTab } from '@app/shared/utils/categorize-tab';
import { extractDomain, normalizeUrl } from '@app/shared/utils/url.utils';

export interface TabCaptureContext {
  readonly mode: CaptureMode;
  readonly sessionId?: string;
  readonly standaloneGroupId?: string;
  readonly capturedAt: Date;
}

/**
 * Maps a raw Chrome tab to a `SavedTab` domain entity.
 *
 * - Missing `url` or `title` are handled gracefully (empty string fallback).
 * - `favIconUrl` is optional — passed through if present.
 * - Never throws; Chrome tabs with missing data produce a safe default entity.
 * - `normalizedUrl` strips the fragment and trailing slash from the URL.
 * - `isRestored` is always `false` on initial capture.
 * - `capturedAt` records the exact moment this tab was mapped.
 */
export function mapChromeTabToSavedTab(
  tab: chrome.tabs.Tab,
  context: TabCaptureContext,
  position: number,
): SavedTab {
  const url = tab.url ?? '';
  const title = tab.title ?? '';

  return {
    id: crypto.randomUUID(),
    sessionId: context.mode === 'session' ? context.sessionId : undefined,
    standaloneGroupId: context.mode === 'tabs' ? context.standaloneGroupId : undefined,
    url,
    title,
    favIconUrl: tab.favIconUrl,
    domain: extractDomain(url),
    normalizedUrl: normalizeUrl(url),
    category: categorizeTab(url),
    position,
    pinned: tab.pinned,
    active: tab.active,
    createdAt: context.capturedAt,
    isRestored: false,
    capturedAt: context.capturedAt,
  };
}
