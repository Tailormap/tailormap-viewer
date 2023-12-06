import { ChangeDetectionStrategy, Component, Inject, Injector, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject, catchError, combineLatest, concatMap, finalize, forkJoin, map, Observable, of, startWith, Subject, take, takeUntil,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { ExtentHelper, LayerModel, MapService, OlLayerFilter, OpenlayersExtent } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import {
  selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersWithLegend,
} from '../../../map/state/map.selectors';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { selectHasDrawingFeatures } from '../../drawing/state/drawing.selectors';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';
import { ExtendedAppLayerModel } from '../../../map/models';
import { MapPdfService } from '../../../services/map-pdf/map-pdf.service';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';

// Draw the vector layer with the print extent on the exported map image
const DEBUG_PRINT_EXTENT = false;

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

  public visibleLayers$;

  public hasDrawing$;

  public includeDrawing = new FormControl(true);

  // eslint-disable-next-line rxjs/finnish
  private vectorLayerFilter: OlLayerFilter = layer => (this.includeDrawing.value && layer.get('id') === 'drawing-layer'
    || (DEBUG_PRINT_EXTENT && layer.get('id') === 'print-preview-layer'));

  public exportType = new FormControl<'pdf' | 'image'>('pdf', { nonNullable: true });

  public exportImageForm = new FormBuilder().nonNullable.group({
    width: [ 86.7, Validators.required ],
    height: [ 65, Validators.required ],
    dpi: [ 300, Validators.required ],
  });

  public availableLegendLayers$;

  public exportPdfForm = new FormBuilder().nonNullable.group({
    orientation: new FormControl<'landscape' | 'portrait'>('landscape', { nonNullable: true }),
    title: '',
    footer: '',
    paperSize: new FormControl<'a4' | 'a3'>('a4', { nonNullable: true }),
    dpi: [ 300, Validators.required ],
    autoPrint: false,
    legendLayer: '',
  });

  private printMapExtent$: Observable<OpenlayersExtent | null> = of(null);

  private _mapFilenameFn = (extension: string): Observable<string> => {
    const dateTime = new Intl.DateTimeFormat(this.locale, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date())
      .replace(/[ :,]/g, '_');
    return of(`map-${dateTime}.${extension}`);
  };

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private injector: Injector,
    private applicationMapService: ApplicationMapService,
    private viewerLayoutService: ViewerLayoutService,
    private mapPdfService: MapPdfService,
    @Inject(LOCALE_ID) private locale: string,
  ) {
    this.hasDrawing$ = this.store$.select(selectHasDrawingFeatures).pipe(takeUntil(this.destroyed));
    this.visibleLayers$ = combineLatest([ this.store$.select(selectOrderedVisibleBackgroundLayers), this.applicationMapService.selectOrderedVisibleLayersWithFilters$() ]).pipe(
      map(([ backgroundLayers, layers ]) => [ ...backgroundLayers,  ...layers ]),
      takeUntil(this.destroyed),
    );
    this.availableLegendLayers$ = this.store$.select(selectOrderedVisibleLayersWithLegend).pipe(takeUntil(this.destroyed));
  }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.PRINT);
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.PRINT, component: PrintMenuButtonComponent });

    this.printMapExtent$ = combineLatest([
      this.viewerLayoutService.getUIVisibleMapExtent$(),
      this.visible$,
      this.exportType.valueChanges.pipe(startWith(null)),
      this.exportImageForm.valueChanges.pipe(startWith(null)),
      this.exportPdfForm.valueChanges.pipe(startWith(null)),
    ]).pipe(
      map(([ extent, visible ]) => {
        if (!visible || extent.uiVisibleExtent === null) {
          return null;
        }

        const uiVisibleExtent = this.adjustExtentRatioToExportSettings(extent.uiVisibleExtent);
        if (uiVisibleExtent === null) {
          return null;
        }

        ExtentHelper.shrink(uiVisibleExtent, 20 * extent.resolution);
        if (ExtentHelper.isEmpty(uiVisibleExtent)) {
          return null;
        }

        return uiVisibleExtent;
      }),
    );

    const printMapExtentFeature$ = this.printMapExtent$.pipe(
      map(printMapExtent => {
        return printMapExtent === null ? [] : [ExtentHelper.toPolygon(printMapExtent)];
      }),
    );

    this.mapService.renderFeatures$('print-preview-layer', printMapExtentFeature$, {
      styleKey: 'print-preview-style',
      zIndex: 9999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
    }, { updateWhileAnimating: true }).pipe(takeUntil(this.destroyed)).subscribe();

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

  private wrapFileExport(extension: string, toDataURLExporter: (filename: string, layers: Array<ExtendedAppLayerModel>) => Observable<string>): void {
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

  private getLayers$(): Observable<Array<ExtendedAppLayerModel>> {
    return this.visibleLayers$.pipe(
      take(1),
    );
  }

  private getLegendLayers$(): Observable<Array<ExtendedAppLayerModel>> {
    if (this.exportPdfForm.value.legendLayer === '') {
      return of([]);
    }
    return this.store$.select(selectOrderedVisibleLayersWithLegend).pipe(
      map(layers => layers.filter(layer => layer.id === this.exportPdfForm.value.legendLayer || '')),
      take(1),
    );
  }

  private adjustExtentRatioToExportSettings(extent: OpenlayersExtent): OpenlayersExtent | null {
    let ratio = null;
    const extentRatio = ExtentHelper.getWidth(extent) / ExtentHelper.getHeight(extent);
    if (this.exportType.value === 'image' && this.exportImageForm.valid) {
      const form = this.exportImageForm.getRawValue();
      ratio = form.width / form.height;
    } else if (this.exportType.value === 'pdf' && this.exportPdfForm.valid) {
      const form = this.exportPdfForm.getRawValue();
      ratio = form.orientation === 'portrait' ? 1 / Math.sqrt(2) : Math.sqrt(2);
    }

    if (ratio) {
      extent = extent.slice();
      if (extentRatio > ratio) {
         const extentWidth = ExtentHelper.getHeight(extent) * ratio;
         const shrinkWidth = (ExtentHelper.getWidth(extent) - extentWidth) / 2;
         extent[0] += shrinkWidth;
         extent[2] -= shrinkWidth;
      } else {
        const extentHeight = ExtentHelper.getWidth(extent) / ratio;
        const shrinkHeight = (ExtentHelper.getHeight(extent) - extentHeight) / 2;
        extent[1] += shrinkHeight;
        extent[3] -= shrinkHeight;
      }
      return extent;
    }
    return null;
  }

  public getImageResolution() {
    if (!this.exportImageForm.valid) {
      return '';
    }

    const toPixels = (mm: number, theDpi: number) => (mm / 25.4 * theDpi).toFixed();
    const form = this.exportImageForm.getRawValue();
    return `${toPixels(form.width, form.dpi)} × ${toPixels(form.height, form.dpi)}`;
  }

  public getImageRatio() {
    if (!this.exportImageForm.valid) {
      return 1;
    }
    const form = this.exportImageForm.getRawValue();
    return form.width / form.height;
  }

  public downloadMapImage(): void {
    const isValidLayer = (layer: LayerModel | null): layer is LayerModel => layer !== null;

    const form = this.exportImageForm.getRawValue();

    this.printMapExtent$.pipe(take(1)).subscribe(printMapExtent => {
      this.wrapFileExport('png', (filename, layers) =>
        forkJoin(layers.map(layer => this.applicationMapService.convertAppLayerToMapLayer$(layer))).pipe(
          map(mapLayers => mapLayers.filter(isValidLayer)),
          concatMap(mapLayers => {
            return this.mapService.exportMapImage$(
              {
                widthInMm: form.width,
                heightInMm: form.height,
                dpi: form.dpi,
                extent: printMapExtent,
                layers: mapLayers,
                vectorLayerFilter: this.vectorLayerFilter,
              });
          }),
        ),
      );
    });
  }

  public downloadPdf() {
    const form = this.exportPdfForm.getRawValue();

    this.printMapExtent$.pipe(take(1)).subscribe(printMapExtent => {
      this.wrapFileExport('pdf', (filename, layers) => this.mapPdfService.create$({
        orientation: form.orientation,
        size: form.paperSize,
        mapExtent: printMapExtent,
        dpi: form.dpi,
        title: form.title,
        footer: form.footer,
        autoPrint: form.autoPrint,
        filename,
      }, layers, this.getLegendLayers$(), this.vectorLayerFilter));
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
