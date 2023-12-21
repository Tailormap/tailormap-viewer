import { Inject, Injectable, LOCALE_ID, OnDestroy } from '@angular/core';
import { ExtentHelper, LayerModel, MapService, OlLayerFilter, OpenlayersExtent } from '@tailormap-viewer/map';
import {
  catchError, combineLatest, concatMap, forkJoin, map, Observable, of, pipe, Subject, take, takeUntil, UnaryFunction,
} from 'rxjs';
import { ExtendedAppLayerModel } from '../../map/models';
import { selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersWithLegend } from '../../map/state/map.selectors';
import { Store } from '@ngrx/store';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { ViewerLayoutService } from '../../services/viewer-layout/viewer-layout.service';
import { ApplicationMapService } from '../../map/services/application-map.service';
import { MapPdfService } from '../../services/map-pdf/map-pdf.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { withLatestFrom } from 'rxjs/operators';

export interface PrintableLayers {
  layers: LayerModel[];
  backgroundLayers: LayerModel[];
}

export interface PrintOptions {
  type: 'pdf' | 'image';
  dpi: number;
  includeDrawing?: boolean;
}

export interface PrintPdfOptions extends PrintOptions {
  type: 'pdf';
  orientation: 'landscape' | 'portrait';
  title: string;
  footer: string;
  paperSize: 'a4' | 'a3';
  autoPrint: boolean;
  legendLayer: string;
}

export interface PrintImageOptions extends PrintOptions {
  type: 'image';
  width: number;
  height: number;
}

export type PrintResult = Observable<{ dataURL: string; filename: string } | null>;

// Draw the vector layer with the print extent on the exported map image
const DEBUG_PRINT_EXTENT = false;

@Injectable({
  providedIn: 'root',
})
export class PrintService implements OnDestroy {

  private destroyed = new Subject();
  private cancelled$ = new Subject();

  private _mapFilenameFn = (extension: string): string => {
    const dateTime = new Intl.DateTimeFormat(this.locale, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date())
      .replace(/[ :,]/g, '_');
    return `map-${dateTime}.${extension}`;
  };

  constructor(
    private store$: Store,
    private viewerLayoutService: ViewerLayoutService,
    private applicationMapService: ApplicationMapService,
    private mapPdfService: MapPdfService,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    @Inject(LOCALE_ID) private locale: string,
  ) {}

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public get mapFilenameFn(): (extension: string) => string {
    return this._mapFilenameFn;
  }

  /**
   * Extension point to change the filename used for image and PDF download. Called with an extension that excludes the point (for example
   * 'png' or 'pdf'). The default implementation generates a filename like 'map-2022-07-11_14_13_22.pdf'.
   */
  public set mapFilenameFn(value: (extension: string) => string) {
    this._mapFilenameFn = value;
  }

  public cancel(): void {
    this.cancelled$.next(null);
  }

  public downloadPdf$(options: PrintPdfOptions): PrintResult {
    const filename = this.mapFilenameFn('pdf');
    return this.getMapExtent$(options)
      .pipe(
        take(1),
        withLatestFrom(this.getLayers$()),
        concatMap(([ printMapExtent, layers ]) => {
          const printOptions = {
            orientation: options.orientation,
            size: options.paperSize,
            mapExtent: printMapExtent,
            dpi: options.dpi,
            title: options.title,
            footer: options.footer,
            autoPrint: options.autoPrint,
            filename,
          };
          return this.mapPdfService.create$({
            printOptions,
            layers: layers.layers,
            backgroundLayers: layers.backgroundLayers,
            legendLayers$: this.getLegendLayers$(options),
            vectorLayerFilter: this.getVectorLayerFilterFunction(options),
          });
        }),
        takeUntil(this.destroyed),
        takeUntil(this.cancelled$),
        map(dataURL => ({ dataURL, filename })),
        catchError(message => this.handleExportError(message)),
      );
  }

  public downloadMapImage$(options: PrintImageOptions): PrintResult {
    const filename = this.mapFilenameFn('png');
    return this.getMapExtent$(options)
      .pipe(
        take(1),
        withLatestFrom(this.getLayers$()),
        concatMap(([ printMapExtent, printableLayers ]) => {
          return this.mapService.exportMapImage$({
            widthInMm: options.width,
            heightInMm: options.height,
            dpi: options.dpi,
            extent: printMapExtent,
            layers: printableLayers.layers,
            backgroundLayers: printableLayers.backgroundLayers,
            vectorLayerFilter: this.getVectorLayerFilterFunction(options),
          });
        }),
        takeUntil(this.destroyed),
        takeUntil(this.cancelled$),
        map(dataURL => ({ dataURL, filename })),
        catchError(message => this.handleExportError(message)),
      );
  }

  private handleExportError(message: any) {
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
  }

  private getVectorLayerFilterFunction(options: PrintOptions): OlLayerFilter {
    const validLayers = new Set(options.includeDrawing ? ['drawing-layer'] : []);
    if (DEBUG_PRINT_EXTENT) {
      validLayers.add('print-preview-layer');
    }
    // eslint-disable-next-line rxjs/finnish
    return layer => validLayers.has(layer.get('id'));
  }

  public static downloadDataURL(dataURL: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public getMapExtent$(options: PrintOptions) {
    return this.viewerLayoutService.getUIVisibleMapExtent$().pipe(
      map(extent => {
        if (extent.uiVisibleExtent === null) {
          return null;
        }

        const uiVisibleExtent = this.adjustExtentRatioToExportSettings(options, extent.uiVisibleExtent);
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
  }

  private adjustExtentRatioToExportSettings(
    options: PrintOptions,
    extent: OpenlayersExtent,
  ): OpenlayersExtent | null {
    let ratio = null;
    const extentRatio = ExtentHelper.getWidth(extent) / ExtentHelper.getHeight(extent);
    if (this.isPrintImageOptions(options)) {
      ratio = options.width / options.height;
    } else if (this.isPrintPdfOptions(options)) {
      ratio = options.orientation === 'portrait' ? 1 / Math.sqrt(2) : Math.sqrt(2);
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

  private isPrintPdfOptions(options: PrintOptions): options is PrintPdfOptions {
    return options.type === 'pdf';
  }

  private isPrintImageOptions(options: PrintOptions): options is PrintImageOptions {
    return options.type === 'image';
  }

  private getLayers$(): Observable<PrintableLayers> {
    return combineLatest([
      this.applicationMapService.selectOrderedVisibleLayersWithFilters$().pipe(this.convertLayerToLayerModel()),
      this.store$.select(selectOrderedVisibleBackgroundLayers).pipe(this.convertLayerToLayerModel()),
    ]).pipe(
      take(1),
      map(([ layers, backgroundLayers ]) => ({ layers, backgroundLayers })),
    );
  }

  private convertLayerToLayerModel(): UnaryFunction<Observable<ExtendedAppLayerModel[]>, Observable<LayerModel[]>> {
    const isValidLayer = (layer: LayerModel | null): layer is LayerModel => layer !== null;
    return pipe(
      take(1),
      concatMap((layers: ExtendedAppLayerModel[]) => forkJoin(layers.map(layer => this.applicationMapService.convertAppLayerToMapLayer$(layer)))),
      map(lyr => lyr.filter(isValidLayer)),
    );
  }

  private getLegendLayers$(options: PrintPdfOptions): Observable<Array<ExtendedAppLayerModel>> {
    if (options.legendLayer === '') {
      return of([]);
    }
    return this.store$.select(selectOrderedVisibleLayersWithLegend).pipe(
      map(layers => layers.filter(layer => layer.id === (options.legendLayer || ''))),
      take(1),
    );
  }

}
