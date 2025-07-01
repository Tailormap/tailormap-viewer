import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, take, tap } from 'rxjs';
import { VersionModel } from './version.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'tm-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AboutDialogComponent {
  private httpClient = inject(HttpClient);
  public dialogRef = inject<MatDialogRef<AboutDialogComponent>>(MatDialogRef);


  public static VERSIONS_JSON_URL = '/version.json';

  public version$: Observable<VersionModel | null>;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadingSubject.next(true);
    this.version$ = this.httpClient.get<VersionModel>(AboutDialogComponent.VERSIONS_JSON_URL)
      .pipe(
        take(1),
        catchError((): Observable<VersionModel> => of({
          version: "",
          buildDate: "",
          addedPackages: [],
        })),
        tap(() => this.loadingSubject.next(false)),
      );
  }

  public static open(dialog: MatDialog) {
    return dialog.open(AboutDialogComponent, {
      width: '375px',
      height: '400px',
    });
  }

  public close() {
    this.dialogRef.close();
  }

}
