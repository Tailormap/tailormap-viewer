import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Switch3DComponent } from './switch3-d.component';

@NgModule({
  declarations: [
    Switch3DComponent,
  ],
  imports: [
    CommonModule,
    ClipboardModule,
    SharedModule,
  ],
  exports: [
    Switch3DComponent,
  ],
})
export class Switch3DModule {
}
