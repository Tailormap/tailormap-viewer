import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './catalog-page/catalog-page.component';
import { TemplatesModule } from '../templates/templates.module';
import { CatalogModule } from '../catalog/catalog.module';



@NgModule({
  declarations: [
    AdminHomePageComponent,
    CatalogPageComponent,
  ],
  imports: [
    CommonModule,
    TemplatesModule,
    CatalogModule,
  ],
  exports: [
    AdminHomePageComponent,
    CatalogPageComponent,
  ],
})
export class PagesModule { }
