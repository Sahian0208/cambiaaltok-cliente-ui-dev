import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthModule, authInterceptor } from 'angular-auth-oidc-client';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DialogService } from 'primeng/dynamicdialog';
import { httpBasicInterceptor } from './core/interceptors/http-basic.interceptor';
import {
  errorInterceptor,
  loadingInterceptor,
  TranslationHttpLoader,
} from 'bc-primeng-ui';
import { provideTransloco } from '@jsverse/transloco';

const getDefaultLang = (): string => localStorage.getItem('lang') ?? 'es-ES';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor(),
        httpBasicInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ]),
    ),

    importProvidersFrom(
      AuthModule.forRoot({
        config: {
          authority: environment.oauth.authority,
          redirectUrl: window.location.origin + '/auth/callback',
          postLogoutRedirectUri: window.location.origin,
          clientId: environment.oauth.clientId,
          scope: environment.oauth.scope,
          responseType: 'code',
          silentRenew: true,
          renewTimeBeforeTokenExpiresInSeconds: 60,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
        },
      }),
    ),
    provideTransloco({
      config: {
        availableLangs: ['es-ES'],
        defaultLang: getDefaultLang(),
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslationHttpLoader,
    }),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
    MessageService,
    ConfirmationService,
    DialogService,
  ],
};
