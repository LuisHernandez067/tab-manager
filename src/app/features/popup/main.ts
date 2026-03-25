import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { dbProvider } from '@app/data/dexie/db.provider';

import { PopupAppComponent } from './app.component';

bootstrapApplication(PopupAppComponent, {
  providers: [
    provideAnimations(),
    dbProvider,
  ],
}).catch((err: unknown) => console.error(err));
