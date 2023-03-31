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
import { ApplicationDetailsComponent } from './application/application-details/application-details.component';
import { ApplicationHomeComponent } from './application/application-home/application-home.component';

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
        component: ApplicationDetailsComponent,
      },
    ],
  },
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
  { path: RoutesEnum.USER, component: UserAdminPageComponent },
  { path: RoutesEnum.GROUP, component: GroupsPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
