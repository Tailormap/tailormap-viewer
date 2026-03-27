import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApplicationStyleService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtendedAppLayerModel, selectVisibleLayersWithAttributes } from '../../../map';
import { SnappingService } from './snapping.service';

@Component({
  selector: 'tm-snapping',
  templateUrl: './snapping.component.html',
  styleUrls: ['./snapping.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SnappingComponent implements OnInit {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private snappingService = inject(SnappingService);
  private destroyRef = inject(DestroyRef);

  public toolActive = signal(false);
  public availableLayers = this.store$.selectSignal(selectVisibleLayersWithAttributes);
  public selectedLayers$ = this.snappingService.snappingLayers$
    .pipe(map(layers => new Set(layers.map(l => l.id))));

  public ngOnInit(): void {
    this.mapService.setSnappingTolerance(10);
    this.mapService.setSnappingLayerStyle({
      styleKey: 'snapping-style',
      zIndex: 999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
    });
    this.snappingService.snappingGeometries$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(geometries => {
        this.mapService.setSnappingFeatures(geometries);
      });
  }

  public toggleLayer(layer: ExtendedAppLayerModel) {
    this.snappingService.toggleLayer(layer);
  }

  public toggleTool() {
    if (!this.toolActive()) {
      this.mapService.allowSnapping(true);
      this.snappingService.showGeometries();
      this.toolActive.set(true);
    } else {
      this.mapService.allowSnapping(false);
      this.snappingService.hideGeometries();
      this.toolActive.set(false);
    }
  }

}
