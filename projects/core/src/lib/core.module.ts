import { NgModule } from '@angular/core';
import { ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { coreReducer } from './state/core.reducer';
import { coreStateKey } from './state/core.state';
import { CoreEffects } from './state/core.effects';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1Service } from '@tailormap-viewer/api';
import { ICON_SERVICE_ICON_LOCATION, IconService, SharedModule } from '@tailormap-viewer/shared';
import { ApplicationMapService } from './services/application-map.service';
import { ComponentsModule } from './components/components.module';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { LoginComponent } from './pages/login/login.component';
import { LoginFormComponent } from './pages/login/login-form/login-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from './interceptors/security.interceptor';

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

@NgModule({
  declarations: [
    ViewerAppComponent,
    LoginComponent,
    LoginFormComponent,
  ],
  imports: [
    StoreModule.forRoot({
      [coreStateKey]: coreReducer,
    }, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictStateSerializability: true,
        strictActionTypeUniqueness: true,
      },
    }),
    EffectsModule.forRoot([ CoreEffects ]),
    MapModule,
    SharedModule,
    ComponentsModule,
  ],
  exports: [
    ViewerAppComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'assets/core/imgs/' },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
  ],
})
export class CoreModule {
  constructor(
    _applicationMapService: ApplicationMapService,
    matIconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    iconService: IconService,
  ) {
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer);
  }
}
