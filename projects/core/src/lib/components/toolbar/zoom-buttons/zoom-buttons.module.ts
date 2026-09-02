import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoomButtonsComponent } from './zoom-buttons.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ZoomButtonsComponent,
    ],
    exports: [
        ZoomButtonsComponent,
    ],
})
export class ZoomButtonsModule { }
