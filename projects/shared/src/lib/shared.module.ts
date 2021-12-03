import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';

@NgModule({
  declarations: [
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    SharedImportsModule,
  ],
})
export class SharedModule { }
