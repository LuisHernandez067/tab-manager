import Dexie, { type Table } from 'dexie';

import type {
  BackupRecord,
  Collection,
  Rule,
  SavedTab,
  SessionSnapshot,
  Tag,
} from '@app/shared/models';

export class TabManagerDB extends Dexie {
  sessions!: Table<SessionSnapshot, string>;
  tabs!: Table<SavedTab, string>;
  collections!: Table<Collection, string>;
  tags!: Table<Tag, string>;
  rules!: Table<Rule, string>;
  backups!: Table<BackupRecord, string>;

  constructor() {
    super('TabManagerDB');

    this.version(1).stores({
      sessions: 'id, status, createdAt, collectionId',
      tabs: 'id, sessionId, domain, normalizedUrl, [sessionId+domain], capturedAt',
      collections: 'id, slug',
      tags: 'id, slug, isAuto',
      rules: 'id, type, priority, [enabled+priority]',
      backups: 'id, type, createdAt',
    });
  }
}
