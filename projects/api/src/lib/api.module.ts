import { NgModule } from '@angular/core';
import { ApiComponent } from './api.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    ApiComponent,
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    ApiComponent,
  ],
})
export class ApiModule { }
