import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarDismiss, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarMessageOptionsModel } from './snack-bar-message-options.model';
import { map, Observable, takeWhile, timer } from 'rxjs';

@Component({
  selector: 'tm-snack-bar-message',
  templateUrl: './snack-bar-message.component.html',
  styleUrls: ['./snack-bar-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SnackBarMessageComponent implements OnInit {
  public data = inject<SnackBarMessageOptionsModel>(MAT_SNACK_BAR_DATA);
  private snackBarRef = inject<MatSnackBarRef<SnackBarMessageComponent>>(MatSnackBarRef);

  public progress$: null | Observable<number> = null;

  public static open$(matSnackBar: MatSnackBar, config: SnackBarMessageOptionsModel): Observable<MatSnackBarDismiss> {
    const panelClass = ['snack-bar-message-panel'];
    if (config.showDuration) {
      panelClass.push('snack-bar-message-panel--show-duration');
    }
    const ref = matSnackBar.openFromComponent<SnackBarMessageComponent>(SnackBarMessageComponent, {
      data: config,
      panelClass,
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
