import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTemplateComponent } from './admin-template/admin-template.component';
import { NavigationComponent } from './admin-template/navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterOutlet } from "@angular/router";


@NgModule({
  declarations: [
    AdminTemplateComponent,
    NavigationComponent,
  ],
    imports: [
        CommonModule,
        SharedModule,
        RouterOutlet,
    ],
  exports: [
    AdminTemplateComponent,
  ],
})
export class TemplatesModule { }
