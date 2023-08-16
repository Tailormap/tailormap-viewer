import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { Routes } from './routes';
import { GeoServiceDetailsComponent } from './catalog/geo-service-details/geo-service-details.component';
import { GeoServiceLayerDetailsComponent } from './catalog/geo-service-layer-details/geo-service-layer-details.component';
import { CatalogNodeDetailsComponent } from './catalog/catalog-node-details/catalog-node-details.component';
import { UserAdminPageComponent } from './pages/user-admin-page/user-admin-page.component';
import { GroupsPageComponent } from './pages/groups-page/groups-page.component';
import { FeatureSourceDetailsComponent } from './catalog/feature-source-details/feature-source-details.component';
import { FeatureTypeDetailsComponent } from './catalog/feature-type-details/feature-type-details.component';
import { ApplicationPageComponent } from './pages/application-page/application-page.component';
import { OIDCConfigurationPageComponent } from './pages/oidc-configuration-page/oidc-configuration-page.component';
import { ApplicationCreateComponent } from './application/application-create/application-create.component';
import { ApplicationHomeComponent } from './application/application-home/application-home.component';
import { ApplicationEditComponent } from './application/application-edit/application-edit.component';
import { ApplicationEditSettingsComponent } from './application/application-edit-settings/application-edit-settings.component';
import { ApplicationEditLayersComponent } from './application/application-edit-layers/application-edit-layers.component';
import { ApplicationEditBaseLayersComponent } from './application/application-edit-base-layers/application-edit-base-layers.component';
import { ApplicationEditComponentsComponent } from './application/application-edit-components/application-edit-components.component';
import { ApplicationEditStylingComponent } from './application/application-edit-styling/application-edit-styling.component';
import { OIDCConfigurationHomeComponent } from './oidc/oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationCreateComponent } from './oidc/oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationEditComponent } from './oidc/oidc-configuration-edit/oidc-configuration-edit.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { CatalogHomeComponent } from './catalog/catalog-home/catalog-home.component';
import { UserHomeComponent } from './user/user-home/user-home.component';
import { UserCreateComponent } from './user/user-create/user-create.component';
import { UserEditComponent } from './user/user-edit/user-edit.component';
import { GroupHomeComponent } from './user/group-home/group-home.component';
import { GroupCreateComponent } from './user/group-create/group-create.component';
import { GroupEditComponent } from './user/group-edit/group-edit.component';

const routes: Routes = [
  {
    path: Routes.CATALOG,
    component: CatalogPageComponent,
    children: [
      {
        path: '',
        component: CatalogHomeComponent,
      },
      {
        path: Routes.CATALOG_LAYER_DETAILS,
        component: GeoServiceLayerDetailsComponent,
      },
      {
        path: Routes.CATALOG_SERVICE_DETAILS,
        component: GeoServiceDetailsComponent,
      },
      {
        path: Routes.CATALOG_NODE_DETAILS,
        component: CatalogNodeDetailsComponent,
      },
      {
        path: Routes.FEATURE_SOURCE_DETAILS,
        component: FeatureSourceDetailsComponent,
      },
      {
        path: Routes.FEATURE_TYPE_DETAILS,
        component: FeatureTypeDetailsComponent,
      },
    ],
  },
  {
    path: Routes.APPLICATION,
    component: ApplicationPageComponent,
    children: [
      {
        path: '',
        component: ApplicationHomeComponent,
      },
      {
        path: Routes.APPLICATION_CREATE,
        component: ApplicationCreateComponent,
      },
      {
        path: Routes.APPLICATION_DETAILS,
        component: ApplicationEditComponent,
        data: { className: 'full-screen-settings' },
        children: [
          {
            path: '',
            component: ApplicationEditSettingsComponent,
          },
          {
            path: Routes.APPLICATION_DETAILS_LAYERS,
            component: ApplicationEditLayersComponent,
          },
          {
            path: Routes.APPLICATION_DETAILS_BASE_LAYERS,
            component: ApplicationEditBaseLayersComponent,
          },
          {
            path: Routes.APPLICATION_DETAILS_COMPONENTS,
            component: ApplicationEditComponentsComponent,
          },
          {
            path: Routes.APPLICATION_DETAILS_STYLING,
            component: ApplicationEditStylingComponent,
          },
        ],
      },
    ],
  },
  {
    path: Routes.OIDC_CONFIGURATION,
    component: OIDCConfigurationPageComponent,
    children: [
      {
        path: '',
        component: OIDCConfigurationHomeComponent,
      },
      {
        path: Routes.OIDC_CONFIGURATION_CREATE,
        component: OIDCConfigurationCreateComponent,
      },
      {
        path: Routes.OIDC_CONFIGURATION_DETAILS,
        component: OIDCConfigurationEditComponent,
      },
    ],
  },
  // IMPORTANT: When you add a route, also add it to the FrontController class of tailormap-api, otherwise a user will get a 404 when
  // pressing F5 in their browser on your route.
  { path: Routes.ADMIN_HOME, component: AdminHomePageComponent },
  { path: Routes.LOGIN, component: AdminLoginPageComponent },
  {
    path: Routes.USER,
    component: UserAdminPageComponent,
    children: [
      {
        path: '',
        component: UserHomeComponent,
      },
      {
        path: Routes.USER_CREATE,
        component: UserCreateComponent,
      },
      {
        path: Routes.USER_DETAILS,
        component: UserEditComponent,
      },
    ],
  },
  {
    path: Routes.GROUP,
    component: GroupsPageComponent,
    children: [
      {
        path: '',
        component: GroupHomeComponent,
      },
      {
        path: Routes.GROUP_CREATE,
        component: GroupCreateComponent,
      },
      {
        path: Routes.GROUP_DETAILS,
        component: GroupEditComponent,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
