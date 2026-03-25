import { TestBed } from '@angular/core/testing';

import { MessageSenderService } from '@app/core/messaging';
import { SettingsService } from '@app/core/settings';
import { dbProvider } from '@app/data/dexie/db.provider';
import { SessionRepository } from '@app/data/repositories/session.repository';
import { installChromeMock, restoreNativeChrome } from '../../../testing/chrome-api.mock';

import { PopupAppComponent } from './app.component';

describe('PopupAppComponent', () => {
  beforeEach(async () => {
    installChromeMock();

    await TestBed.configureTestingModule({
      imports: [PopupAppComponent],
      providers: [
        dbProvider,
        SessionRepository,
        { provide: MessageSenderService, useValue: jasmine.createSpyObj<MessageSenderService>('MessageSenderService', ['send']) },
        {
          provide: SettingsService,
          useValue: {
            captureScope: () => 'currentWindow' as const,
            setCaptureScope: jasmine.createSpy('setCaptureScope').and.resolveTo(),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    restoreNativeChrome();
  });

  it('should render capture actions and the open dashboard link', () => {
    const fixture = TestBed.createComponent(PopupAppComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const dashboardLink = fixture.nativeElement.querySelector('a');

    expect(text).toContain('Capture Session');
    expect(text).toContain('Capture Tabs');
    expect(text).toContain('Open Dashboard');
    expect(dashboardLink?.getAttribute('href')).toContain('dashboard/index.html');
  });
});
