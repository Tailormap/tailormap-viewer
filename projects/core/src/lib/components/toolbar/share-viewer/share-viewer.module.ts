import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ShareViewerComponent } from './share-viewer.component';
import { ShareViewerDialogComponent } from './share-viewer-dialog/share-viewer-dialog.component';
import { A11yModule } from '@angular/cdk/a11y';

@NgModule({
    imports: [
        CommonModule,
        ClipboardModule,
        SharedModule,
        A11yModule,
        ShareViewerComponent,
        ShareViewerDialogComponent,
    ],
    exports: [
        ShareViewerComponent,
    ],
})
export class ShareViewerModule {
}
