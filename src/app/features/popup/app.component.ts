import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CaptureActionsComponent } from './components/capture-actions/capture-actions.component';
import { SessionCountBadgeComponent } from './components/session-count-badge/session-count-badge.component';

@Component({
  selector: 'tm-popup-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CaptureActionsComponent, SessionCountBadgeComponent],
  template: `
    <div class="popup-container d-flex flex-column" style="min-width: 320px; min-height: 200px;">
      <header class="popup-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
        <h1 class="h6 mb-0 fw-bold text-primary">Tab Manager</h1>
        <tm-session-count-badge />
      </header>
      <main class="popup-main flex-grow-1 d-flex flex-column align-items-stretch px-3 py-3 gap-2">
        <tm-capture-actions />
      </main>
      <footer class="popup-footer px-3 py-2 border-top">
        <a
          [href]="dashboardUrl"
          target="_blank"
          rel="noopener"
          class="btn btn-sm btn-outline-secondary w-100"
        >Open Dashboard</a>
      </footer>
    </div>
  `,
})
export class PopupAppComponent {
  readonly dashboardUrl: string = chrome.runtime.getURL('dashboard/index.html');
}
