import Dexie from 'dexie';

import { TabManagerDB } from './tab-manager-db';

describe('TabManagerDB', () => {
  it('should backfill capture metadata during the v2 migration', async () => {
    const databaseName = `tab-manager-migration-${crypto.randomUUID()}`;

    const legacyDb = new Dexie(databaseName);
    legacyDb.version(1).stores({
      sessions: 'id, status, createdAt, collectionId',
      tabs: 'id, sessionId, domain, normalizedUrl, [sessionId+domain], capturedAt',
      collections: 'id, slug',
      tags: 'id, slug, isAuto',
      rules: 'id, type, priority, [enabled+priority]',
      backups: 'id, type, createdAt',
    });

    await legacyDb.open();
    await legacyDb.table('sessions').add({
      id: 'session-1',
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
      updatedAt: new Date('2026-03-24T00:00:00.000Z'),
      name: 'Legacy Session',
      status: 'active',
      tabCount: 1,
      sourceWindowIds: [1],
      autoTags: [],
      manualTags: [],
    });
    await legacyDb.table('tabs').add({
      id: 'tab-1',
      sessionId: 'session-1',
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
      url: 'https://example.com',
      title: 'Example',
      domain: 'example.com',
      normalizedUrl: 'https://example.com',
      position: 0,
      pinned: false,
      active: true,
      isRestored: false,
      capturedAt: new Date('2026-03-24T00:00:00.000Z'),
    });
    await legacyDb.close();

    const upgradedDb = new TabManagerDB(databaseName);
    await upgradedDb.open();

    const session = await upgradedDb.sessions.get('session-1');
    const tab = await upgradedDb.tabs.get('tab-1');

    expect(session?.captureMode).toBe('session');
    expect(session?.scope).toBe('currentWindow');
    expect(tab?.category).toBe('other');
    expect(tab?.standaloneGroupId).toBeUndefined();

    await upgradedDb.delete();
  });
});
