import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SessionListComponent } from './components/session-list/session-list.component';

@Component({
  selector: 'tm-side-panel-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionListComponent],
  template: `
    <div class="side-panel-container d-flex flex-column h-100">
      <header class="side-panel-header p-2 border-bottom">
        <h6 class="mb-0">Tab Manager</h6>
      </header>
      <main class="side-panel-main flex-grow-1 overflow-auto p-2">
        <tm-session-list />
      </main>
    </div>
  `,
})
export class SidePanelAppComponent {}
