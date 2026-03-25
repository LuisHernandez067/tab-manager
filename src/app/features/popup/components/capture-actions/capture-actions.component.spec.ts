import { TestBed } from '@angular/core/testing';

import { MessageSenderService } from '@app/core/messaging';
import { SettingsService } from '@app/core/settings';

import { CaptureActionsComponent } from './capture-actions.component';
import { installChromeMock, restoreNativeChrome } from '../../../../../testing/chrome-api.mock';

describe('CaptureActionsComponent', () => {
  const messageSender = jasmine.createSpyObj<MessageSenderService>('MessageSenderService', ['send']);
  const settingsService = {
    captureScope: () => 'currentWindow' as const,
    setCaptureScope: jasmine.createSpy('setCaptureScope').and.resolveTo(),
  };

  beforeEach(async () => {
    installChromeMock({
      windows: {
        getCurrent: jasmine.createSpy('getCurrent').and.resolveTo({ id: 99 }),
      } as unknown as typeof chrome.windows,
    });

    messageSender.send.calls.reset();
    settingsService.setCaptureScope.calls.reset();

    await TestBed.configureTestingModule({
      imports: [CaptureActionsComponent],
      providers: [
        { provide: MessageSenderService, useValue: messageSender },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    restoreNativeChrome();
  });

  it('should render capture session, capture tabs, and scope options', () => {
    const fixture = TestBed.createComponent(CaptureActionsComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Capture Session');
    expect(text).toContain('Capture Tabs');
    expect(text).toContain('Current Window');
    expect(text).toContain('All Windows');
  });

  it('should persist scope changes immediately', async () => {
    const fixture = TestBed.createComponent(CaptureActionsComponent);
    fixture.detectChanges();

    await fixture.componentInstance.updateScope('allWindows');

    expect(settingsService.setCaptureScope).toHaveBeenCalledWith('allWindows');
  });

  it('should dispatch session capture and show honest dry-run copy', async () => {
    messageSender.send.and.resolveTo({
      success: true,
      data: {
        captureMode: 'session',
        scope: 'currentWindow',
        sessionId: 'session-1',
        tabCount: 3,
        dryRunClosedCount: 3,
        message: '3 tabs saved! (Dry run: 3 tabs would be closed.)',
      },
    });

    const fixture = TestBed.createComponent(CaptureActionsComponent);
    fixture.detectChanges();

    await fixture.componentInstance.capture('session');
    fixture.detectChanges();

    expect(messageSender.send).toHaveBeenCalledWith({
      type: 'CAPTURE',
      mode: 'session',
      currentWindowId: 99,
    });
    expect(fixture.nativeElement.textContent).toContain('Dry run: 3 tabs would be closed.');
  });

  it('should dispatch tab capture mode', async () => {
    messageSender.send.and.resolveTo({
      success: true,
      data: {
        captureMode: 'tabs',
        scope: 'currentWindow',
        standaloneGroupId: 'group-1',
        tabCount: 2,
        dryRunClosedCount: 2,
        message: '2 tabs saved! (Dry run: 2 tabs would be closed.)',
      },
    });

    const fixture = TestBed.createComponent(CaptureActionsComponent);
    fixture.detectChanges();

    await fixture.componentInstance.capture('tabs');

    expect(messageSender.send).toHaveBeenCalledWith({
      type: 'CAPTURE',
      mode: 'tabs',
      currentWindowId: 99,
    });
  });
});
