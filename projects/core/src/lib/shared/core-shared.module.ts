import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomPanelComponent } from './components/bottom-panel/bottom-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { DialogComponent } from './components/dialog';

@NgModule({
  declarations: [
    BottomPanelComponent,
    DialogComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    BottomPanelComponent,
    DialogComponent,
  ],
})
export class CoreSharedModule { }
