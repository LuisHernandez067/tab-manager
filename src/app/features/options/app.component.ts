import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tm-options-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="container p-4">
      <h1 class="h4 mb-4 fw-bold">Tab Manager — Settings</h1>
      <p class="text-muted">Options surface — Phase 3 implementation pending</p>
    </div>
  `,
})
export class OptionsAppComponent {}
