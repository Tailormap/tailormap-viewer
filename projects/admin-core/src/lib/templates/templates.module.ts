import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTemplateComponent } from './admin-template/admin-template.component';
import { NavigationComponent } from './admin-template/navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileComponent } from './admin-template/navigation/profile/profile.component';


@NgModule({
  declarations: [
    AdminTemplateComponent,
    NavigationComponent,
    ProfileComponent,
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
