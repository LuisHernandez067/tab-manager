import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageSenderService } from '@app/core/messaging';
import type {
  PanicCaptureRequest,
  PanicCaptureResult,
} from '@app/core/messaging/tab-manager-message.types';

/**
 * T5.2 — Panic button component.
 * Sends PANIC_CAPTURE to the service worker, shows a loading spinner,
 * and renders success or error feedback from the typed response.
 */
@Component({
  selector: 'tm-panic-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column gap-2">
      <button
        type="button"
        class="btn btn-danger btn-lg w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
        [disabled]="isLoading()"
        (click)="captureNow()"
      >
        @if (isLoading()) {
          <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          <span>Capturing…</span>
        } @else {
          <span>🚨 Capture Tabs</span>
        }
      </button>

      @if (lastResult(); as result) {
        <div class="alert alert-success py-2 px-3 mb-0 small">
          Saved <strong>{{ result.tabCount }}</strong> tabs as
          '<strong>{{ result.sessionName }}</strong>'
        </div>
      }

      @if (errorMessage(); as err) {
        <div class="text-danger small">{{ err }}</div>
      }
    </div>
  `,
})
export class PanicButtonComponent {
  private readonly messageSender = inject(MessageSenderService);

  readonly isLoading = signal(false);
  readonly lastResult = signal<PanicCaptureResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  async captureNow(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await this.messageSender.send<PanicCaptureRequest, PanicCaptureResult>(
        { type: 'PANIC_CAPTURE' },
      );

      if (response.success) {
        this.lastResult.set(response.data);
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set(response.error);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
