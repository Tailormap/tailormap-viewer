import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { GeoRegistryPageComponent } from './pages/geo-registry-page/geo-registry-page.component';
import { RoutesEnum } from './routes';
import { GeoRegistrySourcesPageComponent } from './pages/geo-registry-sources-page/geo-registry-sources-page.component';
import { GeoRegistryAttributesPageComponent } from './pages/geo-registry-attributes-page/geo-registry-attributes-page.component';

const routes: Routes = [
  { path: RoutesEnum.GEO_REGISTRY, component: GeoRegistryPageComponent },
  { path: RoutesEnum.GEO_REGISTRY_SOURCES, component: GeoRegistrySourcesPageComponent },
  { path: RoutesEnum.GEO_REGISTRY_ATTRIBUTES, component: GeoRegistryAttributesPageComponent },
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
