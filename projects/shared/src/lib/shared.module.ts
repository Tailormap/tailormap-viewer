import { NgModule } from '@angular/core';
import { SharedComponent } from './shared.component';
import { SharedImportsModule } from './shared-imports.module';

@NgModule({
  declarations: [
    SharedComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    SharedImportsModule,
    SharedComponent,
  ],
})
export class SharedModule { }
