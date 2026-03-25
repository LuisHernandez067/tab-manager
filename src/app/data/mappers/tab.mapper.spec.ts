import { mapChromeTabToSavedTab } from './tab.mapper';

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

describe('mapChromeTabToSavedTab', () => {
  const capturedAt = new Date('2026-03-24T12:00:00.000Z');

  it('should map session captures with category metadata', () => {
    const savedTab = mapChromeTabToSavedTab(
      createChromeTab({
        id: 1,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API',
        title: 'MDN',
        pinned: false,
        active: true,
      }),
      {
        mode: 'session',
        sessionId: 'session-1',
        capturedAt,
      },
      0,
    );

    expect(savedTab.sessionId).toBe('session-1');
    expect(savedTab.standaloneGroupId).toBeUndefined();
    expect(savedTab.category).toBe('docs');
    expect(savedTab.createdAt).toEqual(capturedAt);
  });

  it('should map standalone captures without a session id', () => {
    const savedTab = mapChromeTabToSavedTab(
      createChromeTab({
        id: 2,
        url: 'https://github.com/',
        title: 'GitHub',
        pinned: true,
        active: false,
      }),
      {
        mode: 'tabs',
        standaloneGroupId: 'group-1',
        capturedAt,
      },
      3,
    );

    expect(savedTab.sessionId).toBeUndefined();
    expect(savedTab.standaloneGroupId).toBe('group-1');
    expect(savedTab.category).toBe('dev');
    expect(savedTab.position).toBe(3);
  });
});
