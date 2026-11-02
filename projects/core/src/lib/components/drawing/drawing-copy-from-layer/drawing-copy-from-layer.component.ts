import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { catchError, concatMap, EMPTY, Observable, of, take } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapClickEvent } from '@tailormap-viewer/map';
import { SnackBarMessageComponent, TooltipDirective } from '@tailormap-viewer/shared';
import { DrawingService } from '../../../map/services/drawing.service';
import { CopiedDrawingFeaturesResult, DrawingCopyFeaturesService } from '../services/drawing-copy-features.service';
import { selectDrawingFeatures } from '../state/drawing.selectors';
import { addFeatures } from '../state/drawing.actions';
import { DrawingFeatureModelAttributes } from '../../../map/models/drawing-feature.model';


@Component({
  selector: 'tm-drawing-copy-from-layer',
  templateUrl: './drawing-copy-from-layer.component.html',
  styleUrls: ['./drawing-copy-from-layer.component.css'],
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    FormField,
    MatButton,
    MatIcon,
    TooltipDirective,
  ],
})
export class DrawingCopyFromLayerComponent {
  private store$ = inject(Store);
  private drawingService = inject(DrawingService);
  private drawingCopyFeaturesService = inject(DrawingCopyFeaturesService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  private static NO_OBJECTS_FOUND_MESSAGE = $localize `:@@core.drawing.no-objects-found:No objects found at this location`;
  private static COPY_ERROR_MESSAGE = $localize `:@@core.drawing.copy-objects-error:Could not copy objects from the layer`;

  private layerFormField = signal<{ layerId: string | null }>({ layerId: null });
  public layerForm = form(this.layerFormField);
  public selectedLayerId = computed(() => this.layerFormField().layerId);
  public referenceLayers = toSignal(this.drawingCopyFeaturesService.getReferenceLayers$(), { initialValue: [] });
  public copyFromLayerActive = this.drawingService.copyFromLayerActive.asReadonly();

  constructor() {
    effect(() => {
      const layers = this.referenceLayers();
      untracked(() => {
        const selectedLayerId = this.selectedLayerId();
        if (selectedLayerId && !layers.some(layer => layer.id === selectedLayerId)) {
          this.layerForm.layerId().value.set(null);
          this.drawingService.disableCopyFromLayer();
        }
      });
    });

    this.drawingService.copyFeaturesClicked$
      .pipe(
        concatMap(mapClick => this.copyFeaturesAt$(mapClick)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => this.handleCopyResult(result));
  }

  public toggleCopyFromLayer() {
    if (this.copyFromLayerActive()) {
      this.drawingService.disableCopyFromLayer();
    } else if (this.selectedLayerId()) {
      this.drawingService.enableCopyFromLayer();
    }
  }

  private copyFeaturesAt$(mapClick: MapClickEvent): Observable<CopiedDrawingFeaturesResult> {
    const layerId = this.selectedLayerId();
    if (!layerId || !this.copyFromLayerActive()) {
      return EMPTY;
    }
    const attributes: Partial<DrawingFeatureModelAttributes> = this.drawingService.lockedStyle() ? { lockedStyle: true } : {};
    return this.store$.select(selectDrawingFeatures)
      .pipe(
        take(1),
        concatMap(existingFeatures => this.drawingCopyFeaturesService.getDrawingFeaturesAt$(
          layerId,
          mapClick.mapCoordinates,
          mapClick.pointerType,
          this.drawingService.style(),
          existingFeatures,
          attributes,
        )),
        catchError(error => {
          console.error('[Drawing copy from layer] Error copying features from layer to the drawing', error);
          return of({ features: [], error: DrawingCopyFromLayerComponent.COPY_ERROR_MESSAGE });
        }),
      );
  }

  private handleCopyResult(result: CopiedDrawingFeaturesResult) {
    if (result.features.length > 0) {
      this.store$.dispatch(addFeatures({ features: result.features }));
      return;
    }
    SnackBarMessageComponent.open$(this.snackBar, {
      message: result.error || DrawingCopyFromLayerComponent.NO_OBJECTS_FOUND_MESSAGE,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    });
  }

}
