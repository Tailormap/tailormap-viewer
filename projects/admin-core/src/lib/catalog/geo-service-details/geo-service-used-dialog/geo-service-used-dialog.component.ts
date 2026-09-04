import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { ApplicationModel, GeoServiceModel } from '@tailormap-admin/admin-api';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'tm-admin-geo-service-used-dialog',
    templateUrl: './geo-service-used-dialog.component.html',
    styleUrls: ['./geo-service-used-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        RouterLink,
        MatDialogActions,
        MatButton,
    ],
})
export class GeoServiceUsedDialogComponent {
  public data = inject<{
    applications: ApplicationModel[]; service: GeoServiceModel;
  }>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<GeoServiceUsedDialogComponent>>(MatDialogRef);

  public onConfirm() {
    this.dialogRef.close(true);
  }

}
