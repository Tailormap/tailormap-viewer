import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeatureSourceCreateModel } from '../models/feature-source-update.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';

export interface FeatureSourceFormDialogData {
  featureSource: ExtendedFeatureSourceModel | null;
  parentNode: string;
}

@Component({
  selector: 'tm-admin-feature-source-form-dialog',
  templateUrl: './feature-source-form-dialog.component.html',
  styleUrls: ['./feature-source-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureSourceFormDialogComponent {

  public featureSource: FeatureSourceCreateModel | null = null;
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FeatureSourceFormDialogData,
    private dialogRef: MatDialogRef<FeatureSourceFormDialogComponent, FeatureSourceModel | null>,
    private featureSourceService: FeatureSourceService,
  ) { }

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
