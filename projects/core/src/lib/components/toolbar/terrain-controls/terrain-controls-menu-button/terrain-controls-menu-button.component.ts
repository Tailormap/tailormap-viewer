import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../../state';
import { MenubarButtonComponent } from '../../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-terrain-controls-menu-button',
    templateUrl: './terrain-controls-menu-button.component.html',
    styleUrls: ['./terrain-controls-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class TerrainControlsMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.TERRAIN_CONTROLS;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.terrain-controls:Terrain controls`));
}
