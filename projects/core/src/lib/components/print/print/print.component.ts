import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, finalize, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { MapService } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapPdfService } from '../../../services/map-pdf/map-pdf.service';

@Component({
  selector: 'tm-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private cancelled$ = new Subject();
  public busy$ = new BehaviorSubject(false);

  public visible$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private mapPdfService: MapPdfService,
  ) {}

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(PRINT_ID);
    this.menubarService.registerComponent(PrintMenuButtonComponent);

    this.busy$.pipe(
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

  private wrapAction(observable$: Observable<any>): void {
    this.busy$.next(true);
    observable$.pipe(
      takeUntil(this.destroyed),
      takeUntil(this.cancelled$),
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
      take(1), // make pipe complete after emitting once for finalize()
      finalize(() => this.busy$.next(false)),
    ).subscribe();
  }

  public downloadMapImage(): void {
    this.wrapAction(this.mapService.createImageExport(173.4, 130, 150).pipe(
      tap(dataURL => {
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'map.png';
        a.click();
      }),
    ));
  }

  public downloadPDF(): void {
    this.wrapAction(this.mapPdfService.create$({ orientation: 'landscape', size: 'a4', resolution: 150, title: 'Print test'}));
  }
}
