import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { SnappingComponent } from './snapping.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        SnappingComponent,
    ],
    exports: [
        SnappingComponent,
    ],
})
export class SnappingModule { }
