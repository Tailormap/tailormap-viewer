import { NgModule } from '@angular/core';
import { ApiComponent } from './api.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [
    ApiComponent,
  ],
    imports: [
        SharedModule,
        RouterModule,
    ],
  exports: [
    ApiComponent,
  ],
})
export class ApiModule { }
