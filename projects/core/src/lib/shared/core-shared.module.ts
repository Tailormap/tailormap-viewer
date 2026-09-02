import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomPanelComponent } from './components/bottom-panel/bottom-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { DialogComponent } from './components/dialog';
import { ImageWithDescriptionComponent } from './components/image-with-description/image-with-description.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        BottomPanelComponent,
        DialogComponent,
        ImageWithDescriptionComponent,
    ],
    exports: [
        BottomPanelComponent,
        DialogComponent,
        ImageWithDescriptionComponent,
    ],
})
export class CoreSharedModule { }
