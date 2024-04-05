import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ShareViewerComponent } from './share-viewer.component';
import { ShareViewerDialogComponent } from './share-viewer-dialog/share-viewer-dialog.component';
import { A11yModule } from '@angular/cdk/a11y';

@NgModule({
  declarations: [
    ShareViewerComponent,
    ShareViewerDialogComponent,
  ],
  imports: [
    CommonModule,
    ClipboardModule,
    SharedModule,
    A11yModule,
  ],
  exports: [
    ShareViewerComponent,
  ],
})
export class ShareViewerModule {
}
