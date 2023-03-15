import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { RoutesEnum } from './routes';
import { GeoServiceDetailsComponent } from './catalog/geo-service-details/geo-service-details.component';
import { GeoServiceLayerDetailsComponent } from './catalog/geo-service-layer-details/geo-service-layer-details.component';
import { CatalogNodeDetailsComponent } from './catalog/catalog-node-details/catalog-node-details.component';

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
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
