import { ChangeDetectionStrategy, Component, Inject, Injector, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject, catchError, combineLatest, concatMap, finalize, forkJoin, from, map, Observable, of, Subject, take, takeUntil, tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { LayerModel, MapService, OlLayerFilter } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import { selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersAndServices } from '../../../map/state/map.selectors';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { selectHasDrawingFeatures } from '../../drawing/state/drawing.selectors';

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

  public hasDrawing$;

  public includeDrawing = new FormControl(true);

  // eslint-disable-next-line rxjs/finnish
  private vectorLayerFilter: OlLayerFilter = layer => !!(this.includeDrawing.value && layer.get('id') === 'drawing-layer');

  public exportType = new FormControl<'pdf' | 'image'>('pdf', { nonNullable: true });

  public exportImageForm = new FormBuilder().nonNullable.group({
    width: [ 86.7, Validators.required ],
    height: [ 65, Validators.required ],
    dpi: [ 300, Validators.required ],
  });

  public exportPdfForm = new FormBuilder().nonNullable.group({
    orientation: new FormControl<'landscape' | 'portrait'>('landscape', { nonNullable: true }),
    title: '',
    footer: '',
    paperSize: new FormControl<'a4' | 'a3'>('a4', { nonNullable: true }),
    dpi: [ 300, Validators.required ],
    autoPrint: false,
  });

  private _mapFilenameFn = (extension: string): Observable<string> => {
    const dateTime = new Intl.DateTimeFormat(this.locale, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date())
      .replace(/ |:|,/g, '_');
    return of(`map-${dateTime}.${extension}`);
  };

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private injector: Injector,
    private applicationMapService: ApplicationMapService,
    @Inject(LOCALE_ID) private locale: string,
  ) {
    this.hasDrawing$ = this.store$.select(selectHasDrawingFeatures).pipe(takeUntil(this.destroyed));
  }

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

  private wrapFileExport(extension: string, toDataURLExporter: (filename: string, layers: LayerModel[]) => Observable<string>): void {
    this.busy$.next(true);
    forkJoin([ this._mapFilenameFn(extension), this.getLayers$() ]).pipe(
      concatMap(([ filename, layers ]) => combineLatest([ of(filename), toDataURLExporter(filename, layers) ])),
      tap(([ filename, dataURL ]) => PrintComponent.downloadDataURL(dataURL, filename)),
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

  private getLayers$(): Observable<LayerModel[]> {
    const isValidLayer = (layer: LayerModel | null): layer is LayerModel => layer !== null;
    return combineLatest([ this.store$.select(selectOrderedVisibleBackgroundLayers), this.store$.select(selectOrderedVisibleLayersAndServices) ]).pipe(
      map(([ backgroundLayers, layers ]) => [ ...backgroundLayers,  ...layers ]),
      concatMap(layers => forkJoin(layers.map(layer => this.applicationMapService.convertAppLayerToMapLayer$(layer.layer, layer.service)))),
      map(layers => layers.filter(isValidLayer)),
      take(1),
    );
  }

  public getImageResolution() {
    if (!this.exportImageForm.valid) {
      return '';
    }

    const toPixels = (mm: number, theDpi: number) => (mm / 25.4 * theDpi).toFixed();
    const dpi = this.exportImageForm.value.dpi as number;
    return `${toPixels(this.exportImageForm.value.width as number, dpi)} × ${toPixels(this.exportImageForm.value.height as number, dpi)}`;
  }

  public downloadMapImage(): void {
    const form = this.exportImageForm.getRawValue();
    this.wrapFileExport('png', (filename, layers) => this.mapService.exportMapImage$(
      {
        widthInMm: form.width,
        heightInMm: form.height,
        resolution: form.dpi,
        layers,
        vectorLayerFilter: this.vectorLayerFilter,
      }));
  }

  public downloadPdf() {
    const form = this.exportPdfForm.getRawValue();
    from(import('../../../services/map-pdf/map-pdf.service'))
      .pipe(map(m => this.injector.get(m.MapPdfService)))
      .subscribe(mapPdfService => {
        this.wrapFileExport('pdf', (filename, layers) => mapPdfService.create$({
          orientation: form.orientation,
          size: form.paperSize,
          resolution: form.dpi,
          title: form.title,
          footer: form.footer,
          autoPrint: form.autoPrint,
          filename,
        }, layers, this.vectorLayerFilter));
      });
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
