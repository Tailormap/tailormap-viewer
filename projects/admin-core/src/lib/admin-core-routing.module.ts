import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { RoutesEnum } from './routes';
import { GeoServiceDetailsComponent } from './catalog/geo-service-details/geo-service-details.component';
import { GeoServiceLayerDetailsComponent } from './catalog/geo-service-layer-details/geo-service-layer-details.component';
import { CatalogNodeDetailsComponent } from './catalog/catalog-node-details/catalog-node-details.component';
import { UserAdminPageComponent } from './pages/user-admin-page/user-admin-page.component';
import { GroupsPageComponent } from './pages/groups-page/groups-page.component';
import { FeatureSourceDetailsComponent } from './catalog/feature-source-details/feature-source-details.component';
import { FeatureTypeDetailsComponent } from './catalog/feature-type-details/feature-type-details.component';
import { ApplicationPageComponent } from './pages/application-page/application-page.component';
import { ApplicationCreateComponent } from './application/application-create/application-create.component';
import { ApplicationHomeComponent } from './application/application-home/application-home.component';
import { ApplicationEditComponent } from './application/application-edit/application-edit.component';
import { ApplicationEditSettingsComponent } from './application/application-edit-settings/application-edit-settings.component';
import { ApplicationEditLayersComponent } from './application/application-edit-layers/application-edit-layers.component';
import { ApplicationEditBaseLayersComponent } from './application/application-edit-base-layers/application-edit-base-layers.component';
import { ApplicationEditComponentsComponent } from './application/application-edit-components/application-edit-components.component';
import { ApplicationEditStylingComponent } from './application/application-edit-styling/application-edit-styling.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';

const routes: Routes = [
  {
    path: RoutesEnum.CATALOG,
    component: CatalogPageComponent,
    children: [
      {
        path: RoutesEnum.CATALOG_LAYER_DETAILS,
        component: GeoServiceLayerDetailsComponent,
      },
      {
        path: RoutesEnum.CATALOG_SERVICE_DETAILS,
        component: GeoServiceDetailsComponent,
      },
      {
        path: RoutesEnum.CATALOG_NODE_DETAILS,
        component: CatalogNodeDetailsComponent,
      },
      {
        path: RoutesEnum.FEATURE_SOURCE_DETAILS,
        component: FeatureSourceDetailsComponent,
      },
      {
        path: RoutesEnum.FEATURE_TYPE_DETAILS,
        component: FeatureTypeDetailsComponent,
      },
    ],
  },
  {
    path: RoutesEnum.APPLICATION,
    component: ApplicationPageComponent,
    children: [
      {
        path: '',
        component: ApplicationHomeComponent,
      },
      {
        path: RoutesEnum.APPLICATION_CREATE,
        component: ApplicationCreateComponent,
      },
      {
        path: RoutesEnum.APPLICATION_DETAILS,
        component: ApplicationEditComponent,
        data: { className: 'full-screen-settings' },
        children: [
          {
            path: '',
            component: ApplicationEditSettingsComponent,
          },
          {
            path: RoutesEnum.APPLICATION_DETAILS_LAYERS,
            component: ApplicationEditLayersComponent,
          },
          {
            path: RoutesEnum.APPLICATION_DETAILS_BASE_LAYERS,
            component: ApplicationEditBaseLayersComponent,
          },
          {
            path: RoutesEnum.APPLICATION_DETAILS_COMPONENTS,
            component: ApplicationEditComponentsComponent,
          },
          {
            path: RoutesEnum.APPLICATION_DETAILS_STYLING,
            component: ApplicationEditStylingComponent,
          },
        ],
      },
    ],
  },
  // IMPORTANT: When you add a route, also add it to the FrontController class of tailormap-api, otherwise a user will get a 404 when
  // pressing F5 in their browser on your route.
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
  { path: RoutesEnum.LOGIN, component: AdminLoginPageComponent },
  { path: RoutesEnum.USER, component: UserAdminPageComponent },
  { path: RoutesEnum.GROUP, component: GroupsPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
