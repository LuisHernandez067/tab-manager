import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';

import { SessionRepository } from '@app/data/repositories/session.repository';

@Component({
  selector: 'tm-session-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="session-list">
      @if (sessions().length === 0) {
        <p class="text-muted text-center small py-3">No sessions saved yet.</p>
      } @else {
        <ul class="list-group list-group-flush">
          @for (session of sessions(); track session.id) {
            <li class="list-group-item px-2 py-2">
              <div class="d-flex justify-content-between align-items-start">
                <span class="fw-medium small">{{ session.name }}</span>
                <span class="badge bg-secondary rounded-pill">{{ session.tabCount }}</span>
              </div>
              <div class="text-muted" style="font-size: 0.7rem">
                {{ session.createdAt | date:'short' }}
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class SessionListComponent {
  sessions = toSignal(inject(SessionRepository).getRecent$(), { initialValue: [] });
}
