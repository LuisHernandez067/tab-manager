import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';

import { SessionRepository } from '@app/data/repositories/session.repository';

/**
 * T5.3 — Session count badge component.
 * Subscribes reactively to session count via liveQuery (Dexie) — updates
 * automatically whenever sessions are added or removed, no polling needed.
 */
@Component({
  selector: 'tm-session-count-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-1">
      <span class="badge bg-secondary">
        @if (isLoading()) {
          Sessions saved: —
        } @else {
          Sessions saved: {{ count() }}
        }
      </span>
    </div>
  `,
})
export class SessionCountBadgeComponent {
  readonly count = toSignal(inject(SessionRepository).getCount$(), { initialValue: null });
  readonly isLoading = computed(() => this.count() === null);
}
