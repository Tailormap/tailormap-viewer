import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeatureSourceCreateModel } from '../models/feature-source-update.model';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';

export interface FeatureSourceFormDialogData {
  featureSource: FeatureSourceModel | null;
  parentNode: string;
}

@Component({
  selector: 'tm-admin-feature-source-form-dialog',
  templateUrl: './feature-source-form-dialog.component.html',
  styleUrls: ['./feature-source-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureSourceFormDialogComponent {
  public data = inject<FeatureSourceFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<FeatureSourceFormDialogComponent, FeatureSourceModel | null>>(MatDialogRef);
  private featureSourceService = inject(FeatureSourceService);

  public featureSource: FeatureSourceCreateModel | null = null;
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public static open(
    dialog: MatDialog,
    data: FeatureSourceFormDialogData,
  ): MatDialogRef<FeatureSourceFormDialogComponent, FeatureSourceModel | null> {
    return dialog.open(FeatureSourceFormDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save() {
    if (!this.featureSource) {
      return;
    }
    this.savingSubject.next(true);
    const saveObservable$ = (this.data.featureSource === null
        ? this.featureSourceService.createFeatureSource$(this.featureSource, this.data.parentNode)
        : this.featureSourceService.updateFeatureSource$(this.data.featureSource.id, this.featureSource || {})
    );
    saveObservable$
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        if(result) {
          this.dialogRef.close(result);
        }
      });
  }

  public updateFeatureSource($event: FeatureSourceCreateModel | null) {
    this.featureSource = $event;
  }
}
