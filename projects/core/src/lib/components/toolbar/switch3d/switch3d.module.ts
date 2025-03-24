import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Switch3dComponent } from './switch3d.component';

@NgModule({
  declarations: [
    Switch3dComponent,
  ],
  imports: [
    CommonModule,
    ClipboardModule,
    SharedModule,
  ],
  exports: [
    Switch3dComponent,
  ],
})
export class Switch3dModule {
}
