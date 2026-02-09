import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../../state';

@Component({
  selector: 'tm-terrain-layer-toggle-menu-button',
  templateUrl: './terrain-controls-menu-button.component.html',
  styleUrls: ['./terrain-controls-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainControlsMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.TERRAIN_CONTROLS;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.terrain-controls:Terrain controls`));
}
