import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTemplateComponent } from './admin-template/admin-template.component';
import { NavigationComponent } from './admin-template/navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterOutlet } from "@angular/router";
import { AdminPageTemplateComponent } from './admin-page-template/admin-page-template.component';


@NgModule({
  declarations: [
    AdminTemplateComponent,
    NavigationComponent,
    AdminPageTemplateComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterOutlet,
  ],
  exports: [
    AdminTemplateComponent,
    AdminPageTemplateComponent,
  ],
})
export class TemplatesModule { }
