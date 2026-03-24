import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { OptionsAppComponent } from './app.component';

bootstrapApplication(OptionsAppComponent, {
  providers: [
    provideAnimations(),
  ],
}).catch((err: unknown) => console.error(err));
