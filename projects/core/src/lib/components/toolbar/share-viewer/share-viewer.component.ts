import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ShareViewerDialogComponent } from './share-viewer-dialog/share-viewer-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';

@Component({
  selector: 'tm-share-viewer',
  templateUrl: './share-viewer.component.html',
  styleUrls: ['./share-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewerComponent {

  public toolActive = false;
  private dialogRef: MatDialogRef<ShareViewerDialogComponent, any> | undefined;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public toggle() {
    this.toolActive = !this.toolActive;
    if (this.toolActive) {
      this.dialogRef = this.dialog.open(ShareViewerDialogComponent, {
        width: 'calc(60 * var(--vw))',
      });
      this.dialogRef.afterClosed()
        .pipe(take(1))
        .subscribe(() => {
          this.dialogRef = undefined;
          this.toolActive = false;
          this.cdr.detectChanges();
        });
    } else if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }
}
