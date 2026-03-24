import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tm-dashboard-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="container-fluid p-4">
      <h1 class="h4 mb-4 fw-bold">Tab Manager — Dashboard</h1>
      <p class="text-muted">Dashboard surface — Phase 2 implementation pending</p>
    </div>
  `,
})
export class DashboardAppComponent {}
