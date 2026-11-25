import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal, viewChild } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApplicationStyleService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnappingService } from './snapping.service';
import { selectComponentsConfigForType } from '../../../state';
import {
  BaseComponentTypeEnum, DEFAULT_SNAPPING_TOLERANCE, SnappingComponentConfigModel,
} from '@tailormap-viewer/api';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { AsyncPipe } from '@angular/common';
import { TooltipDirective, ErrorMessageComponent } from '@tailormap-viewer/shared';
import { DataSourceLayerModel } from '../../../models';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'tm-snapping',
    templateUrl: './snapping.component.html',
    styleUrls: ['./snapping.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleGroup,
    TooltipDirective,
    MatButtonToggle,
    MatIcon,
    MatMenuTrigger,
    MatMenu,
    ErrorMessageComponent,
    MatMenuItem,
    AsyncPipe,
    MatProgressSpinner,
  ],
})
export class SnappingComponent implements OnInit {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private snappingService = inject(SnappingService);
  private destroyRef = inject(DestroyRef);

  public toolActive$ = this.snappingService.snappingActive$;
  public isLoadingGeometries$ = this.snappingService.isLoadingGeometries$;

  public selectedLayers$ = this.snappingService.snappingLayers$
    .pipe(map(layers => new Set(layers.map(l => l.id))));
  public selectableLayers$ = this.snappingService.selectableLayers$;
  public tooltip = signal($localize `:@@core.snapping.tooltip:Snapping tool. Select (visible) layers to snap to when measuring, drawing and modifying.`);

  public maxSelectedLayers = 5;

  private layersMenuTrigger = viewChild.required(MatMenuTrigger);

  public ngOnInit(): void {
    this.store$.select(selectComponentsConfigForType<SnappingComponentConfigModel>(BaseComponentTypeEnum.SNAPPING))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => {
        this.mapService.setSnappingTolerance(config?.config.tolerance ?? DEFAULT_SNAPPING_TOLERANCE);
        if (config?.config.title) {
          this.tooltip.set(config.config.title);
        }
        this.setSnappingLayerStyle(config?.config.color);
      });
    this.snappingService.snappingGeometries$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(geometries => {
        this.mapService.setSnappingFeatures(geometries);
      });
  }

  public toggleLayer(layer: DataSourceLayerModel) {
    this.snappingService.toggleLayer(layer);
  }

  public toggleTool() {
    if (this.snappingService.isSnappingActive()) {
      this.snappingService.disableSnapping();
    } else if (this.snappingService.hasSnappingLayers()) {
      this.snappingService.enableSnapping();
    } else {
      // Snapping requires a layer to snap to, let the user pick one
      this.layersMenuTrigger().openMenu();
    }
  }

  private setSnappingLayerStyle(color?: string) {
    this.mapService.setSnappingLayerStyle({
      styleKey: 'snapping-style',
      zIndex: 999,
      strokeColor: color || ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
      pointFillColor: color || ApplicationStyleService.getPrimaryColor(),
      pointSize: 3,
      pointType: 'circle',
    });
  }

}
