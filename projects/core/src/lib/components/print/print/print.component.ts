import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, concatMap, finalize, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { MapService } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapPdfService } from '../../../services/map-pdf/map-pdf.service';
import { FormControl } from '@angular/forms';

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

  public formControl = new FormControl('150', []);

  private _mapFilenameFn = (extension: string): Observable<string> => {
    const dateTime = new Intl.DateTimeFormat('nl-NL',{ dateStyle: 'short', timeStyle: 'medium'}).format(new Date())
      .replace(' ', '_')
      .replace(/:/g, '_');
    return of(`map-${dateTime}.${extension}`);
  };

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
    ).subscribe(printing => document.body.style.cursor = printing ? 'progress' : 'auto');
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public get mapFilenameFn(): (extension: string) => Observable<string> {
    return this._mapFilenameFn;
  }

  /**
   * Extension point to change the filename used for image and PDF download. Called with an extension that excludes the point (for example
   * 'png' or 'pdf'). The default implementation generates a filename like 'map-2022-07-11_14_13_22.pdf'.
   */
  public set mapFilenameFn(value: (extension: string) => Observable<string>) {
    this._mapFilenameFn = value;
  }

  public cancel(): void {
    this.cancelled$.next(null);
  }

  private wrapFileExport(extension: string, toDataURLExporter: (filename: string) => Observable<string>): void {
    this.busy$.next(true);
    this._mapFilenameFn(extension).pipe(
      concatMap(filename => combineLatest([of(filename), toDataURLExporter(filename)])),
      tap(([filename, dataURL]) => PrintComponent.downloadDataURL(dataURL, filename)),
      takeUntil(this.destroyed),
      takeUntil(this.cancelled$),
      catchError(message => {
        console.error(message);
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

  private getDpi(): number {
    const formValue = Number(this.formControl.value);
    return Math.max(72, Math.min(600, formValue));
  }

  public downloadMapImage(): void {
    this.wrapFileExport('png', () => this.mapService.exportMapImage$(173.4, 130, this.getDpi(), console.log));
  }

  public downloadPDF(): void {
    this.wrapFileExport('pdf', filename => this.mapPdfService.create$({
        orientation: 'landscape',
        size: 'a4',
        resolution: this.getDpi(),
        title: 'Print test',
        filename,
      }));
  }

  private static downloadDataURL(dataURL: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
