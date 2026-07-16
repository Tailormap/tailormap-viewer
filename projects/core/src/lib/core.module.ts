import { ModuleWithProviders, NgModule, inject, provideEnvironmentInitializer } from '@angular/core';
import { PasswordResetComponent, LoginComponent, ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import {
  ENVIRONMENT_CONFIG,
  EnvironmentConfigModel,
  TAILORMAP_API_V1_SERVICE, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapApiV1Service, TailormapSecurityApiV1Service,
} from '@tailormap-viewer/api';
import {
  ExternalLibsLoaderHelper, ICON_SERVICE_ICON_LOCATION, IconService, RouterHistoryService, SharedModule,
} from '@tailormap-viewer/shared';
import { ComponentsModule } from './components/components.module';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { ApplicationMapModule } from './map/application-map.module';
import { FilterModule } from './filter/filter.module';
import { RouterModule } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { LayoutModule } from './layout/layout.module';
import { ApplicationStyleService } from './services/application-style.service';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { LoginFormComponent } from './pages/login/login-form/login-form.component';
import { PasswordResetRequestFormComponent } from './pages/login/password-reset-request-form/password-reset-request-form.component';
import { CoreRoutingModule } from './core-routing.module';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { UserLoginCheckService } from './services/user-login-check.service';
import { CoreSharedModule } from './shared/core-shared.module';
import { StoreInstanceProviderHelper } from './viewer-instance/store-instance-provider.helper';

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

@NgModule({
  declarations: [
    ViewerAppComponent,
    LoginComponent,
    LoginFormComponent,
    PasswordResetRequestFormComponent,
    PasswordResetComponent,
  ],
  imports: [
    CoreRoutingModule,
    ApplicationMapModule,
    MapModule,
    FilterModule,
    SharedModule,
    ComponentsModule,
    LayoutModule,
    RouterModule.forRoot([{ path: '', children: [] }]), // Allow all modules to add child routes
    CoreSharedModule,
  ],
  exports: [
    ViewerAppComponent,
    RouterModule,
  ],
  providers: [
    StoreInstanceProviderHelper.getStoreProvider(),
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } },
    provideEnvironmentInitializer(() => {
      inject(ApplicationStyleService).init();
      inject(RouterHistoryService).init();
      inject(IconService).loadIconsToIconRegistry(inject(MatIconRegistry), inject(DomSanitizer));
      ExternalLibsLoaderHelper.setBaseHref(inject(APP_BASE_HREF));
      inject(AuthenticatedUserService).fetchUserDetails();
      inject(UserLoginCheckService).pingUserLoggedIn();
    }),
  ],
})
export class CoreModule {
  public static forRoot(config: EnvironmentConfigModel): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        {
          provide: ENVIRONMENT_CONFIG,
          useValue: config,
        },
      ],
    };
  }
}
