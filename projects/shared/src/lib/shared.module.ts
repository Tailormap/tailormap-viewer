import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
})
export class SharedModule { }
