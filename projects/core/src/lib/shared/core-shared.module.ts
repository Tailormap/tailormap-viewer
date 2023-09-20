import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomPanelComponent } from './components/bottom-panel/bottom-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    BottomPanelComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    BottomPanelComponent,
  ],
})
export class CoreSharedModule { }
