import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureComponent } from './measure.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        MeasureComponent,
    ],
    exports: [
        MeasureComponent,
    ],
})
export class MeasureModule { }
