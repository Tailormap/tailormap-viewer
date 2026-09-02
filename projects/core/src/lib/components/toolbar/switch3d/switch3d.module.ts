import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Switch3dComponent } from './switch3d.component';

@NgModule({
    imports: [
        CommonModule,
        ClipboardModule,
        SharedModule,
        Switch3dComponent,
    ],
    exports: [
        Switch3dComponent,
    ],
})
export class Switch3dModule {
}
