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
import { ApplicationPageComponent } from './application-page/application-page.component';
import { ApplicationModule } from '../application/application.module';



@NgModule({
  declarations: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
    ApplicationPageComponent,
  ],
  imports: [
    CommonModule,
    RouterOutlet,
    TemplatesModule,
    CatalogModule,
    UseradminModule,
    ApplicationModule,
  ],
  exports: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
    ApplicationPageComponent,
  ],
})
export class PagesModule { }
