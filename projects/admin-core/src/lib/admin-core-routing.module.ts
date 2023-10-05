import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Routes as AdminRoutes } from './routes';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { CatalogHomeComponent } from './catalog/catalog-home/catalog-home.component';
import { GeoServiceLayerDetailsComponent } from './catalog/geo-service-layer-details/geo-service-layer-details.component';
import { GeoServiceDetailsComponent } from './catalog/geo-service-details/geo-service-details.component';
import { CatalogNodeDetailsComponent } from './catalog/catalog-node-details/catalog-node-details.component';
import { FeatureSourceDetailsComponent } from './catalog/feature-source-details/feature-source-details.component';
import { FeatureTypeDetailsComponent } from './catalog/feature-type-details/feature-type-details.component';
import { ApplicationPageComponent } from './pages/application-page/application-page.component';
import { ApplicationHomeComponent } from './application/application-home/application-home.component';
import { ApplicationCreateComponent } from './application/application-create/application-create.component';
import { ApplicationEditComponent } from './application/application-edit/application-edit.component';
import { ApplicationEditSettingsComponent } from './application/application-edit-settings/application-edit-settings.component';
import { ApplicationEditLayersComponent } from './application/application-edit-layers/application-edit-layers.component';
import { ApplicationEditBaseLayersComponent } from './application/application-edit-base-layers/application-edit-base-layers.component';
import { ApplicationEditComponentsComponent } from './application/application-edit-components/application-edit-components.component';
import { ApplicationEditStylingComponent } from './application/application-edit-styling/application-edit-styling.component';
import { OIDCConfigurationPageComponent } from './pages/oidc-configuration-page/oidc-configuration-page.component';
import { OIDCConfigurationHomeComponent } from './oidc/oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationCreateComponent } from './oidc/oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationEditComponent } from './oidc/oidc-configuration-edit/oidc-configuration-edit.component';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { UserAdminPageComponent } from './pages/user-admin-page/user-admin-page.component';
import { UserHomeComponent } from './user/user-home/user-home.component';
import { UserCreateComponent } from './user/user-create/user-create.component';
import { UserEditComponent } from './user/user-edit/user-edit.component';
import { GroupsPageComponent } from './pages/groups-page/groups-page.component';
import { GroupHomeComponent } from './user/group-home/group-home.component';
import { GroupCreateComponent } from './user/group-create/group-create.component';
import { GroupEditComponent } from './user/group-edit/group-edit.component';

export const adminRoutes: Routes = [
  {
    path: AdminRoutes.CATALOG,
    component: CatalogPageComponent,
    children: [
      {
        path: '',
        component: CatalogHomeComponent,
      },
      {
        path: AdminRoutes.CATALOG_LAYER_DETAILS,
        component: GeoServiceLayerDetailsComponent,
      },
      {
        path: AdminRoutes.CATALOG_SERVICE_DETAILS,
        component: GeoServiceDetailsComponent,
      },
      {
        path: AdminRoutes.CATALOG_NODE_DETAILS,
        component: CatalogNodeDetailsComponent,
      },
      {
        path: AdminRoutes.FEATURE_SOURCE_DETAILS,
        component: FeatureSourceDetailsComponent,
      },
      {
        path: AdminRoutes.FEATURE_TYPE_DETAILS,
        component: FeatureTypeDetailsComponent,
        data: { className: 'full-screen-settings' },
      },
    ],
  },
  {
    path: AdminRoutes.APPLICATION,
    component: ApplicationPageComponent,
    children: [
      {
        path: '',
        component: ApplicationHomeComponent,
      },
      {
        path: AdminRoutes.APPLICATION_CREATE,
        component: ApplicationCreateComponent,
      },
      {
        path: AdminRoutes.APPLICATION_DETAILS,
        component: ApplicationEditComponent,
        data: { className: 'full-screen-settings' },
        children: [
          {
            path: '',
            component: ApplicationEditSettingsComponent,
          },
          {
            path: AdminRoutes.APPLICATION_DETAILS_LAYERS,
            component: ApplicationEditLayersComponent,
          },
          {
            path: AdminRoutes.APPLICATION_DETAILS_BASE_LAYERS,
            component: ApplicationEditBaseLayersComponent,
          },
          {
            path: AdminRoutes.APPLICATION_DETAILS_COMPONENTS,
            component: ApplicationEditComponentsComponent,
          },
          {
            path: AdminRoutes.APPLICATION_DETAILS_STYLING,
            component: ApplicationEditStylingComponent,
          },
        ],
      },
    ],
  },
  {
    path: AdminRoutes.OIDC_CONFIGURATION,
    component: OIDCConfigurationPageComponent,
    children: [
      {
        path: '',
        component: OIDCConfigurationHomeComponent,
      },
      {
        path: AdminRoutes.OIDC_CONFIGURATION_CREATE,
        component: OIDCConfigurationCreateComponent,
      },
      {
        path: AdminRoutes.OIDC_CONFIGURATION_DETAILS,
        component: OIDCConfigurationEditComponent,
      },
    ],
  },
  // IMPORTANT: When you add a route, also add it to the FrontController class of tailormap-api, otherwise a user will get a 404 when
  // pressing F5 in their browser on your route.
  { path: AdminRoutes.ADMIN_HOME, component: AdminHomePageComponent },
  {
    path: AdminRoutes.USER,
    component: UserAdminPageComponent,
    children: [
      {
        path: '',
        component: UserHomeComponent,
      },
      {
        path: AdminRoutes.USER_CREATE,
        component: UserCreateComponent,
      },
      {
        path: AdminRoutes.USER_DETAILS,
        component: UserEditComponent,
      },
    ],
  },
  {
    path: AdminRoutes.GROUP,
    component: GroupsPageComponent,
    children: [
      {
        path: '',
        component: GroupHomeComponent,
      },
      {
        path: AdminRoutes.GROUP_CREATE,
        component: GroupCreateComponent,
      },
      {
        path: AdminRoutes.GROUP_DETAILS,
        component: GroupEditComponent,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(adminRoutes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
