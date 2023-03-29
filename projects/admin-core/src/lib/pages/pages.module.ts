import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './catalog-page/catalog-page.component';
import { TemplatesModule } from '../templates/templates.module';
import { CatalogModule } from '../catalog/catalog.module';
import { RouterOutlet } from '@angular/router';
import { UserAdminPageComponent } from './user-admin-page/user-admin-page.component';
import { UseradminModule } from '../useradmin/useradmin.module';
import { GroupsPageComponent } from './groups-page/groups-page.component';



@NgModule({
  declarations: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
  ],
  imports: [
    CommonModule,
    RouterOutlet,
    TemplatesModule,
    CatalogModule,
    UseradminModule,
  ],
  exports: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
  ],
})
export class PagesModule { }
