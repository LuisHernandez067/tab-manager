import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { dbProvider } from '@app/data/dexie/db.provider';

import { SidePanelAppComponent } from './app.component';

bootstrapApplication(SidePanelAppComponent, {
  providers: [
    provideAnimationsAsync(),
    dbProvider,
  ],
}).catch((err: unknown) => console.error(err));
