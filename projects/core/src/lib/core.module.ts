import {  ModuleWithProviders, NgModule, inject } from '@angular/core';
import { PasswordResetComponent, LoginComponent, ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import { StoreModule } from '@ngrx/store';
import { coreReducer } from './state/core.reducer';
import { coreStateKey } from './state/core.state';
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
import { getViewerFeatureStateProviders } from './viewer-instance/provide-viewer-instance';

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
    ...getViewerFeatureStateProviders(),
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } },
  ],
})
export class CoreModule {
  //eslint-disable-next-line @angular-eslint/prefer-inject
  constructor( _appStyleService: ApplicationStyleService,
               _routerHistoryService: RouterHistoryService) {
    const matIconRegistry = inject(MatIconRegistry);
    const domSanitizer = inject(DomSanitizer);
    const iconService = inject(IconService);
    const authenticatedUserService = inject(AuthenticatedUserService);
    const adminAuthService = inject(UserLoginCheckService);
    const baseHref = inject(APP_BASE_HREF);

    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer);
    authenticatedUserService.fetchUserDetails();
    adminAuthService.pingUserLoggedIn();
    ExternalLibsLoaderHelper.setBaseHref(baseHref);
  }

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
