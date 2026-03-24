import type { SavedTab } from '@app/shared/models';

import { extractDomain, normalizeUrl } from '@app/shared/utils/url.utils';

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
  sessionId: string,
  position: number,
): SavedTab {
  const url = tab.url ?? '';
  const title = tab.title ?? '';

  return {
    id: crypto.randomUUID(),
    sessionId,
    url,
    title,
    favIconUrl: tab.favIconUrl,
    domain: extractDomain(url),
    normalizedUrl: normalizeUrl(url),
    position,
    pinned: tab.pinned,
    active: tab.active,
    createdAt: new Date(),
    isRestored: false,
    capturedAt: new Date(),
  };
}
