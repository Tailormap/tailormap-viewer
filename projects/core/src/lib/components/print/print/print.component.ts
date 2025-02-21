import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject, combineLatest, finalize, map, Observable, of, startWith, Subject, switchMap, take, takeUntil,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';
import { ExtentHelper, MapService } from '@tailormap-viewer/map';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import {
  selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersWithLegend,
} from '../../../map/state/map.selectors';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { selectHasDrawingFeatures } from '../../drawing/state/drawing.selectors';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { PrintImageOptions, PrintOptions, PrintPdfOptions, PrintResult, PrintService } from '../print.service';

const DEFAULT_IMAGE_OPTIONS: PrintImageOptions = {
  type: 'image',
  width: 86.7,
  height: 65,
  dpi: 300,
};

const DEFAULT_PDF_OPTIONS: PrintPdfOptions = {
  type: 'pdf',
  orientation: 'landscape',
  title: '',
  footer: '',
  paperSize: 'a4',
  dpi: 300,
  autoPrint: false,
  legendLayer: '',
};

@Component({
  selector: 'tm-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PrintComponent implements OnInit, OnDestroy {

  private busySubject = new BehaviorSubject(false);
  public busy$ = this.busySubject.asObservable();

  public visible$: Observable<boolean> = of(false);
  public hasVisibleLayers$: Observable<boolean>;
  public hasDrawing$;
  public availableLegendLayers$;

  public includeDrawing = new FormControl(true);
  public exportType = new FormControl<'pdf' | 'image'>('pdf', { nonNullable: true });
  public exportImageForm = new FormBuilder().nonNullable.group({
    width: [ DEFAULT_IMAGE_OPTIONS.width, Validators.required ],
    height: [ DEFAULT_IMAGE_OPTIONS.height, Validators.required ],
    dpi: [ DEFAULT_IMAGE_OPTIONS.dpi, Validators.required ],
  });
  public exportPdfForm = new FormBuilder().nonNullable.group({
    orientation: new FormControl<'landscape' | 'portrait'>(DEFAULT_PDF_OPTIONS.orientation, { nonNullable: true }),
    title: DEFAULT_PDF_OPTIONS.title,
    footer: DEFAULT_PDF_OPTIONS.footer,
    paperSize: new FormControl<'a4' | 'a3'>(DEFAULT_PDF_OPTIONS.paperSize, { nonNullable: true }),
    dpi: [ DEFAULT_PDF_OPTIONS.dpi, Validators.required ],
    autoPrint: DEFAULT_PDF_OPTIONS.autoPrint,
    legendLayer: DEFAULT_PDF_OPTIONS.legendLayer,
  });

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
    private mapService: MapService,
    private applicationMapService: ApplicationMapService,
    private printService: PrintService,
  ) {
    this.hasDrawing$ = this.store$.select(selectHasDrawingFeatures)
      .pipe(takeUntil(this.destroyed));
    this.hasVisibleLayers$ = combineLatest([ this.store$.select(selectOrderedVisibleBackgroundLayers), this.applicationMapService.selectOrderedVisibleLayersWithFilters$() ])
      .pipe(takeUntil(this.destroyed), map(layers => layers.length > 0));
    this.availableLegendLayers$ = this.store$.select(selectOrderedVisibleLayersWithLegend)
      .pipe(takeUntil(this.destroyed));
  }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.PRINT);
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.PRINT, component: PrintMenuButtonComponent });

    const printMapExtentFeature$ = combineLatest([
      this.visible$,
      this.exportType.valueChanges.pipe(startWith('pdf')),
      this.exportImageForm.valueChanges.pipe(startWith(null)),
      this.exportPdfForm.valueChanges.pipe(startWith(null)),
    ]).pipe(
      switchMap(([visible]) => {
        if (!visible) {
          return of(null);
        }
        const printOptions = this.getPrintOptions();
        if (!printOptions) {
          return of(null);
        }
        return this.printService.getMapExtent$(printOptions)
          .pipe(map(extent => extent ? [ExtentHelper.toPolygon(extent)] : null));
      }),
    );

    this.mapService.renderFeatures$('print-preview-layer', printMapExtentFeature$, {
      styleKey: 'print-preview-style',
      zIndex: 9999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
    }, { updateWhileAnimating: true }).pipe(takeUntil(this.destroyed)).subscribe();

    this.busy$
      .pipe(takeUntil(this.destroyed))
      .subscribe(printing => document.body.style.cursor = printing ? 'progress' : 'auto');
  }

  private getPrintOptions(): PrintPdfOptions | PrintImageOptions | null {
    if (this.exportType.value === 'image' && this.exportImageForm.valid) {
      const options: PrintImageOptions = {
        type: 'image',
        width: this.exportImageForm.value.width || DEFAULT_IMAGE_OPTIONS.width,
        height: this.exportImageForm.value.height || DEFAULT_IMAGE_OPTIONS.height,
        dpi: this.exportImageForm.value.dpi || DEFAULT_IMAGE_OPTIONS.dpi,
        includeDrawing: this.includeDrawing.value ?? undefined,
      };
      return options;
    }
    if (this.exportType.value === 'pdf' && this.exportPdfForm.valid) {
      const options: PrintPdfOptions = {
        type: 'pdf',
        orientation: this.exportPdfForm.value.orientation || DEFAULT_PDF_OPTIONS.orientation,
        title: this.exportPdfForm.value.title || DEFAULT_PDF_OPTIONS.title,
        footer: this.exportPdfForm.value.footer || DEFAULT_PDF_OPTIONS.footer,
        paperSize: this.exportPdfForm.value.paperSize || DEFAULT_PDF_OPTIONS.paperSize,
        autoPrint: this.exportPdfForm.value.autoPrint || DEFAULT_PDF_OPTIONS.autoPrint,
        legendLayer: this.exportPdfForm.value.legendLayer || DEFAULT_PDF_OPTIONS.legendLayer,
        dpi: this.exportPdfForm.value.dpi || DEFAULT_PDF_OPTIONS.dpi,
        includeDrawing: this.includeDrawing.value ?? undefined,
      };
      return options;
    }
    return null;
  }

  public ngOnDestroy(): void {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.PRINT);
    this.printService.cancel();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public cancel(): void {
    this.printService.cancel();
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

  public downloadPdf() {
    this.download('pdf', (options: PrintPdfOptions) => this.printService.downloadPdf$(options));
  }

  public downloadMapImage() {
    this.download('image', (options: PrintImageOptions) => this.printService.downloadMapImage$(options));
  }

  private download<T extends PrintOptions>(type: 'image' | 'pdf', printMethod$: (options: T) => PrintResult) {
    const printOptions = this.getPrintOptions();
    const isOptionsOfType = (opts: PrintOptions | null): opts is T => !!opts && opts.type === type;
    if (!isOptionsOfType(printOptions)) {
      return;
    }
    this.busySubject.next(true);
    printMethod$(printOptions)
      .pipe(take(1), finalize(() => this.busySubject.next(false)))
      .subscribe(result => {
        if (!result) {
          return;
        }
        PrintService.downloadDataURL(result.dataURL, result.filename);
      });
  }

}
