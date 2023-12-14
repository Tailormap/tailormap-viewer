import { NgModule } from '@angular/core';
import { SettingsHomePageComponent } from './settings-home-page/settings-home-page.component';
import { TemplatesModule } from '../templates/templates.module';
import { CommonModule } from '@angular/common';
import { CatalogModule } from '../catalog/catalog.module';
import { RouterOutlet } from '@angular/router';

@NgModule({
  declarations: [
    SettingsHomePageComponent,
  ],
  imports: [
    CommonModule,
    TemplatesModule,
    CatalogModule,
    RouterOutlet,
  ],
})
export class SettingsModule {}
