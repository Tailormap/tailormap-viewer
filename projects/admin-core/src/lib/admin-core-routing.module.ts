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
    ],
  },
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
  { path: RoutesEnum.USER_ADMIN, component: UserAdminPageComponent },
  { path: RoutesEnum.GROUP_ADMIN, component: GroupsPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
