import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel } from '@tailormap-viewer/api';
import { LayoutService } from '../../../layout/layout.service';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { selectComponentsConfigForType } from '../../../state/core.selectors';

@Component({
  selector: 'tm-terrain-controls',
  templateUrl: './terrain-controls.component.html',
  styleUrls: ['./terrain-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainControlsComponent {
  public layoutService = inject(LayoutService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  public tooltip: string = '';
  public opacityLabel: string = $localize `:@@core.terrain-controls.opacity:Terrain opacity`;
  public layerToggleLabel: string = $localize `:@@core.terrain-controls.model:Terrain model`;
  public componentTypes = BaseComponentTypeEnum;

  constructor() {
    combineLatest([
      this.store$.select(selectComponentsConfigForType<ComponentBaseConfigModel>(BaseComponentTypeEnum.TERRAIN_OPACITY)),
      this.store$.select(selectComponentsConfigForType<ComponentBaseConfigModel>(BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE)),
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ opacityConfig, layerToggleConfig ]) => {
        const tooltipParts: string[] = [];
        if (BaseComponentConfigHelper.isComponentEnabled(opacityConfig ? [opacityConfig] : [], BaseComponentTypeEnum.TERRAIN_OPACITY)) {
          this.opacityLabel = opacityConfig?.config.title || $localize `:@@core.terrain-controls.opacity:Terrain opacity`;
          tooltipParts.push(this.opacityLabel);
        }
        if (BaseComponentConfigHelper.isComponentEnabled(layerToggleConfig ? [layerToggleConfig] : [], BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE)) {
          this.layerToggleLabel = layerToggleConfig?.config.title || $localize `:@@core.terrain-controls.model:Terrain model`;
          tooltipParts.push(this.layerToggleLabel);
        }
        this.tooltip = tooltipParts.join(' & ');
      });
  }
}
