import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { GeoRegistryPageComponent } from './pages/geo-registry-page/geo-registry-page.component';
import { RoutesEnum } from './routes';
import { GeoServiceSourcesPageComponent } from './pages/geo-service-sources-page/geo-service-sources-page.component';
import { GeoRegistryAttributesPageComponent } from './pages/geo-service-attributes-page/geo-registry-attributes-page.component';

const routes: Routes = [
  { path: RoutesEnum.GEO_REGISTRY, component: GeoRegistryPageComponent },
  { path: RoutesEnum.GEO_REGISTRY_SOURCES, component: GeoServiceSourcesPageComponent },
  { path: RoutesEnum.GEO_REGISTRY_ATTRIBUTES, component: GeoRegistryAttributesPageComponent },
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
