import { NgModule } from '@angular/core';
import { SettingsHomePageComponent } from './settings-home-page/settings-home-page.component';

import { CommonModule } from '@angular/common';
import { CatalogModule } from '../catalog/catalog.module';
import { RouterOutlet } from '@angular/router';

@NgModule({
    imports: [
    CommonModule,
    CatalogModule,
    RouterOutlet,
    SettingsHomePageComponent,
],
})
export class SettingsModule {}
