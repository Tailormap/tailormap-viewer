import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { DialogComponent } from './components/dialog';

@NgModule({
  declarations: [
    DialogComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    DialogComponent,
    SharedImportsModule,
  ],
})
export class SharedModule { }
