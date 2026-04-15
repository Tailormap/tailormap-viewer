import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApplicationStyleService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtendedAppLayerModel } from '../../../map';
import { SnappingService } from './snapping.service';
import { selectComponentsConfigForType } from '../../../state';
import {
  BaseComponentTypeEnum, DEFAULT_SNAPPING_TOLERANCE, SnappingComponentConfigModel,
} from '@tailormap-viewer/api';

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

  public toolActive$ = this.snappingService.snappingActive$;

  public selectedLayers$ = this.snappingService.snappingLayers$
    .pipe(map(layers => new Set(layers.map(l => l.id))));
  public selectableLayers$ = this.snappingService.selectableLayers$;
  public hasSelectableLayers$ = this.snappingService.hasSelectableLayers$;
  public tooltip = signal($localize `:@@core.snapping.tooltip:Snapping tool. Select (visible) layers to snap to when measuring, drawing and modifying.`);

  public maxSelectedLayers = 5;

  public ngOnInit(): void {
    this.store$.select(selectComponentsConfigForType<SnappingComponentConfigModel>(BaseComponentTypeEnum.SNAPPING))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => {
        this.mapService.setSnappingTolerance(config?.config.tolerance ?? DEFAULT_SNAPPING_TOLERANCE);
        if (config?.config.title) {
          this.tooltip.set(config.config.title);
        }
      });
    this.mapService.setSnappingLayerStyle({
      styleKey: 'snapping-style',
      zIndex: 999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
      pointFillColor: ApplicationStyleService.getPrimaryColor(),
      pointSize: 3,
      pointType: 'circle',
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
    if (!this.snappingService.isSnappingActive()) {
      this.mapService.allowSnapping(true);
      this.snappingService.enableSnapping();
    } else {
      this.mapService.allowSnapping(false);
      this.snappingService.disableSnapping();
    }
  }

}
