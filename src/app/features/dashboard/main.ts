import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { DashboardAppComponent } from './app.component';

bootstrapApplication(DashboardAppComponent, {
  providers: [
    provideAnimations(),
  ],
}).catch((err: unknown) => console.error(err));
