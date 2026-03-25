import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessageSenderService } from '@app/core/messaging';
import { SettingsService } from '@app/core/settings';

import type { CaptureRequest, CaptureResult, CaptureScope } from '@app/core/messaging';

@Component({
  selector: 'tm-capture-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="d-flex flex-column gap-3">
      <div class="d-flex flex-column gap-1">
        <label class="form-label mb-0 small fw-semibold" for="capture-scope">Capture scope</label>
        <select
          id="capture-scope"
          class="form-select form-select-sm"
          [disabled]="isBusy()"
          [ngModel]="settings.captureScope()"
          (ngModelChange)="updateScope($event)"
        >
          <option value="currentWindow">Current Window</option>
          <option value="allWindows">All Windows</option>
        </select>
      </div>

      <div class="d-grid gap-2">
        <button
          type="button"
          class="btn btn-primary fw-semibold"
          [disabled]="isBusy()"
          (click)="capture('session')"
        >
          @if (activeMode() === 'session' && isBusy()) {
            Capturing Session…
          } @else {
            Capture Session
          }
        </button>

        <button
          type="button"
          class="btn btn-outline-primary fw-semibold"
          [disabled]="isBusy()"
          (click)="capture('tabs')"
        >
          @if (activeMode() === 'tabs' && isBusy()) {
            Capturing Tabs…
          } @else {
            Capture Tabs
          }
        </button>
      </div>

      @if (lastResult(); as result) {
        <div class="alert alert-success py-2 px-3 mb-0 small" role="status">
          {{ result.message }}
        </div>
      }

      @if (errorMessage(); as errorMessage) {
        <div class="alert alert-danger py-2 px-3 mb-0 small" role="alert">
          {{ errorMessage }}
        </div>
      }
    </section>
  `,
})
export class CaptureActionsComponent {
  protected readonly settings = inject(SettingsService);

  private readonly messageSender = inject(MessageSenderService);

  readonly isBusy = signal(false);
  readonly activeMode = signal<'session' | 'tabs' | null>(null);
  readonly lastResult = signal<CaptureResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  async updateScope(scope: CaptureScope): Promise<void> {
    this.errorMessage.set(null);

    try {
      await this.settings.setCaptureScope(scope);
    } catch (error: unknown) {
      this.errorMessage.set(error instanceof Error ? error.message : String(error));
    }
  }

  async capture(mode: 'session' | 'tabs'): Promise<void> {
    this.isBusy.set(true);
    this.activeMode.set(mode);
    this.errorMessage.set(null);

    try {
      const currentWindow = await chrome.windows.getCurrent();
      const request: CaptureRequest = {
        type: 'CAPTURE',
        mode,
        currentWindowId: currentWindow.id,
      };
      const response = await this.messageSender.send<CaptureRequest, CaptureResult>(request);

      if (response.success) {
        this.lastResult.set(response.data);
        return;
      }

      this.errorMessage.set(response.error);
    } catch (error: unknown) {
      this.errorMessage.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.isBusy.set(false);
      this.activeMode.set(null);
    }
  }
}
