import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { dbProvider } from '@app/data/dexie/db.provider';

import { SidePanelAppComponent } from './app.component';

bootstrapApplication(SidePanelAppComponent, {
  providers: [
    provideAnimations(),
    dbProvider,
  ],
}).catch((err: unknown) => console.error(err));
