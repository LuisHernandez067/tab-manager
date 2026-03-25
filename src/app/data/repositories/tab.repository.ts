import { inject, Injectable } from '@angular/core';

import { liveQuery } from 'dexie';
import { from, Observable } from 'rxjs';

import type { SavedTab } from '@app/shared/models';

import { TAB_MANAGER_DB } from '../dexie/db.provider';

@Injectable({ providedIn: 'root' })
export class TabRepository {
  private readonly db = inject(TAB_MANAGER_DB);

  /**
   * Reactive list of tabs for the given session.
   * Ordered by position ascending. Updates automatically on DB changes.
   */
  getBySession$(sessionId: string): Observable<SavedTab[]> {
    return from(
      liveQuery(() =>
        this.db.tabs.where('sessionId').equals(sessionId).sortBy('position'),
      ),
    );
  }

  /**
   * Reactive list of tabs for a standalone batch.
   * Ordered by position ascending. Updates automatically on DB changes.
   */
  getByStandaloneGroup$(standaloneGroupId: string): Observable<SavedTab[]> {
    return from(
      liveQuery(() =>
        this.db.tabs.where('standaloneGroupId').equals(standaloneGroupId).sortBy('position'),
      ),
    );
  }

  /**
   * Atomically insert all tabs for a session.
   * @throws {DexieError} on write failure — callers MUST guard tab removal with this.
   */
  async saveBulk(tabs: SavedTab[]): Promise<void> {
    await this.db.transaction('rw', this.db.tabs, async () => {
      await this.db.tabs.bulkAdd(tabs);
    });
  }

  /**
   * Remove all tabs belonging to a session.
   * @throws {DexieError} on write failure.
   */
  async deleteBySession(sessionId: string): Promise<void> {
    await this.db.tabs.where('sessionId').equals(sessionId).delete();
  }
}
