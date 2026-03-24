import { inject, Injectable } from '@angular/core';

import { liveQuery } from 'dexie';
import { from, Observable } from 'rxjs';

import type { SessionSnapshot } from '@app/shared/models';

import { TAB_MANAGER_DB } from '../dexie/db.provider';

@Injectable({ providedIn: 'root' })
export class SessionRepository {
  private readonly db = inject(TAB_MANAGER_DB);

  /** Reactive list of all sessions, sorted newest first. Updates automatically on DB changes. */
  getAll$(): Observable<SessionSnapshot[]> {
    return from(
      liveQuery(() => this.db.sessions.orderBy('createdAt').reverse().toArray()),
    );
  }

  /** Reactive list of the most recent N sessions (default: 10). */
  getRecent$(limit = 10): Observable<SessionSnapshot[]> {
    return from(
      liveQuery(() =>
        this.db.sessions
          .orderBy('createdAt')
          .reverse()
          .limit(limit)
          .toArray(),
      ),
    );
  }

  /** Reactive count of all sessions. Updates automatically on DB changes. */
  getCount$(): Observable<number> {
    return from(liveQuery(() => this.db.sessions.count()));
  }

  /**
   * Persist a session snapshot.
   * @throws {DexieError} on write failure — callers MUST guard tab removal with this.
   */
  async save(snapshot: SessionSnapshot): Promise<void> {
    await this.db.sessions.add(snapshot);
  }

  /**
   * Apply a partial update to an existing session by id.
   * @throws {DexieError} on write failure.
   */
  async update(id: string, changes: Partial<SessionSnapshot>): Promise<void> {
    await this.db.sessions.update(id, changes);
  }
}
