import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { ApplicationService } from '../services/application.service';
import { nanoid } from 'nanoid';
import { UpdateDraftApplicationModel } from '../models/update-draft-application.model';

export interface ApplicationCopyDialogData {
  application: ApplicationModel;
}

@Component({
  selector: 'tm-admin-application-copy-dialog',
  templateUrl: './application-copy-dialog.component.html',
  styleUrls: ['./application-copy-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCopyDialogComponent {
  public data = inject<ApplicationCopyDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<ApplicationCopyDialogComponent, ApplicationModel | null>>(MatDialogRef);
  private applicationService = inject(ApplicationService);

  public application: ApplicationModel;
  public valid = signal(false);

  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor() {
    const data = this.data;

    const copyLabel = $localize `:@@admin-core.common.copy:Copy`;
    this.application = {
      id: nanoid(),
      name: `${data.application.name}-${copyLabel.toLowerCase()}`,
      title: `${data.application.title} ${copyLabel}`,
      crs: data.application.crs,
      authorizationRules: [],
      initialExtent: null,
      maxExtent: null,
    };
  }

  public static open(
    dialog: MatDialog,
    data: ApplicationCopyDialogData,
  ): MatDialogRef<ApplicationCopyDialogComponent, ApplicationModel | null> {
    return dialog.open(ApplicationCopyDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save() {
    if (!this.application || !this.data.application) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...copy } = this.data.application;
    copy.name = this.application.name;
    copy.title = this.application.title;
    this.savingSubject.next(true);
    this.applicationService.createApplication$(copy)
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        this.dialogRef.close(result);
      });
  }

  public updateApplication($event: UpdateDraftApplicationModel | null) {
    if ($event?.application) {
      this.application = { ...this.application, ...$event.application };
    }
  }

  public applicationValidChanged($event: boolean) {
    this.valid.set($event);
  }

}
