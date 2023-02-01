import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarDismiss, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarMessageOptionsModel } from './snack-bar-message-options.model';
import { map, Observable, takeWhile, timer } from 'rxjs';

@Component({
  selector: 'tm-snack-bar-message',
  templateUrl: './snack-bar-message.component.html',
  styleUrls: ['./snack-bar-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackBarMessageComponent implements OnInit {

  public progress$: null | Observable<number> = null;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackBarMessageOptionsModel,
    private snackBarRef: MatSnackBarRef<SnackBarMessageComponent>,
  ) { }

  public static open$(matSnackBar: MatSnackBar, config: SnackBarMessageOptionsModel): Observable<MatSnackBarDismiss> {
    const ref = matSnackBar.openFromComponent<SnackBarMessageComponent>(SnackBarMessageComponent, {
      data: config,
      panelClass: [ 'snack-bar-message-panel', config.showDuration ? 'snack-bar-message-panel--show-duration' : '' ],
      duration: config.duration || undefined,
    });
    return ref.afterDismissed();
  }

  public ngOnInit(): void {
    if (this.data.showDuration && typeof this.data.duration !== 'undefined') {
      const durationSeconds = this.data.duration / 1000;
      const stepSize = 100 / (this.data.duration / 1000);
      this.progress$ = timer(0, 850)
        .pipe(
          takeWhile(count => count <= (durationSeconds + 1)),
          map(count => count * stepSize),
        );
    }
  }

  public closeSnackBar() {
    this.snackBarRef.dismissWithAction();
  }
}
