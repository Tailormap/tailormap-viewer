import { NgModule } from '@angular/core';
import { RegisteredComponentsRendererComponent } from './registered-components-renderer.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    RegisteredComponentsRendererComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    RegisteredComponentsRendererComponent,
  ],
})
export class RegisteredComponentsModule {}
