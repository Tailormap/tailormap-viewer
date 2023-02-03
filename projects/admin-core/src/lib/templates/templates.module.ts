import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTemplateComponent } from './admin-template/admin-template.component';
import { NavigationComponent } from './admin-template/navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterLink, RouterLinkActive } from '@angular/router';


@NgModule({
  declarations: [
    AdminTemplateComponent,
    NavigationComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterLink,
    RouterLinkActive,
  ],
  exports: [
    AdminTemplateComponent,
  ],
})
export class TemplatesModule { }
