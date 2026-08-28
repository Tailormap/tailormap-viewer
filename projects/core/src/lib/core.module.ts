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
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationMapModule } from './map/application-map.module';
import { FilterModule } from './filter/filter.module';
import { RouterModule } from '@angular/router';
import { LayoutModule } from './layout/layout.module';
import { ApplicationStyleService } from './services/application-style.service';
import { LoginFormComponent } from './pages/login/login-form/login-form.component';
import { PasswordResetRequestFormComponent } from './pages/login/password-reset-request-form/password-reset-request-form.component';
import { CoreRoutingModule } from './core-routing.module';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { UserLoginCheckService } from './services/user-login-check.service';
import { CoreSharedModule } from './shared/core-shared.module';
import { TAILORMAP_CROSS_ORIGIN_API_SERVICE } from '@tailormap-viewer/api';
import { ProviderHelper } from './viewer-instance/provider.helper';
import { StoreInstanceProviderHelper } from './viewer-instance/store-instance-provider.helper';

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
    ...ProviderHelper.getBaseProviders(),
    provideEnvironmentInitializer(() => {
      inject(ApplicationStyleService).init();
      inject(RouterHistoryService).init();
      inject(IconService).loadIconsToIconRegistry(inject(MatIconRegistry), inject(DomSanitizer));
      ExternalLibsLoaderHelper.setBaseHref(inject(APP_BASE_HREF));
      inject(AuthenticatedUserService).fetchUserDetails();
      inject(UserLoginCheckService).pingUserLoggedIn();
      inject(TAILORMAP_CROSS_ORIGIN_API_SERVICE).init();
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
