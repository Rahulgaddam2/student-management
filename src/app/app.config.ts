import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // I kept Angular's global listeners for unhandled browser errors.
    provideBrowserGlobalErrorListeners(),

    // I kept the generated setting to group event-driven change detection.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // I register our routes so Angular can navigate between screens.
    provideRouter(routes),

    // I enable HttpClient so our services can call JSON Server.
    provideHttpClient()
  ]
};