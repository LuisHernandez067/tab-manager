import Dexie, { type Table } from 'dexie';

import type {
  BackupRecord,
  Collection,
  Rule,
  SavedTab,
  SessionSnapshot,
  Tag,
} from '@app/shared/models';

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

export class TabManagerDB extends Dexie {
  sessions!: Table<SessionSnapshot, string>;
  tabs!: Table<SavedTab, string>;
  collections!: Table<Collection, string>;
  tags!: Table<Tag, string>;
  rules!: Table<Rule, string>;
  backups!: Table<BackupRecord, string>;

  constructor(databaseName = 'TabManagerDB') {
    super(databaseName);

    this.version(1).stores({
      sessions: 'id, status, createdAt, collectionId',
      tabs: 'id, sessionId, domain, normalizedUrl, [sessionId+domain], capturedAt',
      collections: 'id, slug',
      tags: 'id, slug, isAuto',
      rules: 'id, type, priority, [enabled+priority]',
      backups: 'id, type, createdAt',
    });

    this.version(2)
      .stores({
        sessions: 'id, status, createdAt, collectionId, captureMode, scope',
        tabs:
          'id, sessionId, standaloneGroupId, domain, normalizedUrl, category, [sessionId+domain], capturedAt',
        collections: 'id, slug',
        tags: 'id, slug, isAuto',
        rules: 'id, type, priority, [enabled+priority]',
        backups: 'id, type, createdAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('sessions')
          .toCollection()
          .modify((session: Mutable<SessionSnapshot>) => {
            session.captureMode = 'session';
            session.scope = 'currentWindow';
          });

        await transaction
          .table('tabs')
          .toCollection()
          .modify((tab: Mutable<SavedTab>) => {
            tab.category = 'other';
            tab.standaloneGroupId = undefined;
          });
      });
  }
}
