import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { GeoRegistryPageComponent } from './geo-registry-page/geo-registry-page.component';
import { TemplatesModule } from '../templates/templates.module';
import { GeoRegistrySourcesPageComponent } from './geo-registry-sources-page/geo-registry-sources-page.component';
import { GeoRegistryAttributesPageComponent } from './geo-registry-attributes-page/geo-registry-attributes-page.component';



@NgModule({
  declarations: [
    AdminHomePageComponent,
    GeoRegistryPageComponent,
    GeoRegistrySourcesPageComponent,
    GeoRegistryAttributesPageComponent,
  ],
  imports: [
    CommonModule,
    TemplatesModule,
  ],
  exports: [
    AdminHomePageComponent,
    GeoRegistryPageComponent,
    GeoRegistrySourcesPageComponent,
    GeoRegistryAttributesPageComponent,
  ],
})
export class PagesModule { }
