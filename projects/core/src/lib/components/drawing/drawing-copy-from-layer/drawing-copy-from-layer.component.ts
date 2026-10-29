import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { concatMap, EMPTY, take } from 'rxjs';
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

/**
 * Lets the user select a reference layer and copy features from that layer to the drawing by clicking on the map.
 * Must be used inside the DrawingComponent, which provides the DrawingService.
 */
@Component({
  selector: 'tm-drawing-copy-from-layer',
  templateUrl: './drawing-copy-from-layer.component.html',
  styleUrls: ['./drawing-copy-from-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    ReactiveFormsModule,
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

  public layerControl = new FormControl<string | null>(null);
  public selectedLayerId = toSignal(this.layerControl.valueChanges, { initialValue: this.layerControl.value });
  public referenceLayers = toSignal(this.drawingCopyFeaturesService.getReferenceLayers$(), { initialValue: [] });
  public copyFromLayerActive = this.drawingService.copyFromLayerActive.asReadonly();

  constructor() {
    this.drawingCopyFeaturesService.getReferenceLayers$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layers => {
        const selectedLayerId = this.layerControl.value;
        if (selectedLayerId && !layers.some(layer => layer.id === selectedLayerId)) {
          // Selected layer is no longer available (e.g. made invisible)
          this.layerControl.setValue(null);
          this.drawingService.disableCopyFromLayer();
        }
      });

    this.drawingService.copyFeaturesClicked$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // Handle clicks one after another, so the check for features already in the drawing includes previously copied features
        concatMap(mapClick => this.copyFeaturesAt$(mapClick)),
      )
      .subscribe(result => this.handleCopyResult(result));
  }

  public toggleCopyFromLayer() {
    if (this.copyFromLayerActive()) {
      this.drawingService.disableCopyFromLayer();
    } else if (this.layerControl.value) {
      this.drawingService.enableCopyFromLayer();
    }
  }

  private copyFeaturesAt$(mapClick: MapClickEvent) {
    const layerId = this.layerControl.value;
    if (!layerId || !this.copyFromLayerActive()) {
      return EMPTY;
    }
    return this.store$.select(selectDrawingFeatures)
      .pipe(
        take(1),
        concatMap(existingFeatures => this.drawingCopyFeaturesService.getDrawingFeaturesAt$(
          layerId,
          mapClick.mapCoordinates,
          mapClick.pointerType,
          this.drawingService.style(),
          existingFeatures,
        )),
      );
  }

  private handleCopyResult(result: CopiedDrawingFeaturesResult) {
    if (result.features.length > 0) {
      this.store$.dispatch(addFeatures({ features: result.features }));
      return;
    }
    if (result.alreadyInDrawing) {
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
