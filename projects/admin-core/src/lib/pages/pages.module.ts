import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './catalog-page/catalog-page.component';
import { TemplatesModule } from '../templates/templates.module';
import { CatalogModule } from '../catalog/catalog.module';
import { RouterOutlet } from '@angular/router';
import { UserAdminPageComponent } from './user-admin-page/user-admin-page.component';
import { GroupsPageComponent } from './groups-page/groups-page.component';
import { ApplicationPageComponent } from './application-page/application-page.component';
import { ApplicationModule } from '../application/application.module';
import { SettingsPageComponent } from './settings-page/settings-page.component';
import { SharedComponentsModule, SharedImportsModule, SharedModule } from '@tailormap-viewer/shared';
import { UserModule } from '../user/user.module';
import { FormPageComponent } from './form-page/form-page.component';
import { FormModule } from '../form/form.module';
import { SearchIndexPageComponent } from './search-index-page/search-index-page.component';
import { SearchIndexModule } from '../search-index/search-index.module';
import { LogsPageComponent } from './logs-page/logs-page.component';
import { TasksPageComponent } from './tasks-page/tasks-page.component';
import { TasksModule } from '../tasks/tasks.module';


@NgModule({
  declarations: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
    ApplicationPageComponent,
    SettingsPageComponent,
    FormPageComponent,
    SearchIndexPageComponent,
    LogsPageComponent,
    TasksPageComponent,
  ],
  imports: [
    CommonModule,
    RouterOutlet,
    TemplatesModule,
    CatalogModule,
    UserModule,
    ApplicationModule,
    SharedComponentsModule,
    SharedImportsModule,
    SharedModule,
    FormModule,
    SearchIndexModule,
    TasksModule,
  ],
  exports: [
    AdminHomePageComponent,
    CatalogPageComponent,
    UserAdminPageComponent,
    GroupsPageComponent,
    ApplicationPageComponent,
    SettingsPageComponent,
    FormPageComponent,
    SearchIndexPageComponent,
    LogsPageComponent,
    TasksPageComponent,
  ],
})
export class PagesModule { }
