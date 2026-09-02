import { NgModule } from '@angular/core';
import { RegisteredComponentsRendererComponent } from './registered-components-renderer.component';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        CommonModule,
        RegisteredComponentsRendererComponent,
    ],
    exports: [
        RegisteredComponentsRendererComponent,
    ],
})
export class RegisteredComponentsModule {}
