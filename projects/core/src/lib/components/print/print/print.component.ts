import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { MapService } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'tm-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private cancelled$ = new Subject();
  public printing$ = new BehaviorSubject(false);

  public visible$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
    private mapService: MapService,
    private snackBar: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(PRINT_ID);
    this.menubarService.registerComponent(PrintMenuButtonComponent);

    this.printing$.pipe(
      takeUntil(this.destroyed),
      tap(printing => document.body.style.cursor = printing ? 'progress' : 'auto'),
    ).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public cancel(): void {
    this.cancelled$.next(null);
  }

  public createPDF(): void {
    this.printing$.next(true);

    this.mapService.createImageExport(60, 40, 150).
      pipe(
        takeUntil(this.destroyed),
        takeUntil(this.cancelled$),
        map(dataURL => {
          const a = document.createElement('a');
          a.href = dataURL;
          a.download = 'map.png';
          a.click();
        }),
        catchError(message => {
          const config: SnackBarMessageOptionsModel = {
            message,
            duration: 5000,
            showDuration: true,
            showCloseButton: true,
          };
          // Do not return the snackbar afterDismissed observable, change 'Cancel' button back immediately
          SnackBarMessageComponent.open$(this.snackBar, config);
          return of(null);
        }),
        finalize(() => {
          this.printing$.next(false);
        }),
    ).subscribe();
  }
}
