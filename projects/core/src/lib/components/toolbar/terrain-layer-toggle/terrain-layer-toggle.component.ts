import { Component, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { SplitButtonOptionModel } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import {
  selectInitiallySelectedTerrainNodes, selectSelectedTerrainNodeId, selectTerrainNodesList,
} from '../../../map/state/map.selectors';
import { setSelectedTerrainNodeId } from '../../../map/state/map.actions';

@Component({
  selector: 'tm-terrain-layer-toggle',
  templateUrl: './terrain-layer-toggle.component.html',
  styleUrls: ['./terrain-layer-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrainLayerToggleComponent {

  public selectedTerrainNodeId$: Observable<string | undefined>;
  public terrainLayers$: Observable<SplitButtonOptionModel[]>;
  public initiallyCheckedLabels$: Observable<string>;

  constructor(
    private store$: Store,
  ) {
    this.selectedTerrainNodeId$ = combineLatest([
      this.store$.select(selectInitiallySelectedTerrainNodes),
      this.store$.select(selectSelectedTerrainNodeId),
    ]).pipe(
      map(([ initiallySelectedTerrainNodes, selectedTerrainNodeId ]) => {
        return selectedTerrainNodeId ||
          (initiallySelectedTerrainNodes.length === 1
            ? initiallySelectedTerrainNodes[0].id
            : undefined);
      }));
    this.terrainLayers$ = this.store$.select(selectTerrainNodesList).pipe(
      map(nodes => this.getEmptyOption().concat([
        ...nodes.map(node => ({ id: node.id, label: node.name })),
      ])),
    );
    this.initiallyCheckedLabels$ = this.store$.select(selectInitiallySelectedTerrainNodes).pipe(
      map(nodes => {
        if (nodes.length === 0) {
          return $localize `:@@core.terrain-layer-toggle.ellipsoid:WGS84 Ellipsoid`;
        }
        return nodes.map(node => node.name).join(', ')
      }),
    );
  }

  public terrainChanged(id: string) {
    this.store$.dispatch(setSelectedTerrainNodeId({ id }));
  }

  private getEmptyOption(): SplitButtonOptionModel[] {
    return [{ id: 'WGS84_ELLIPSOID', label: $localize `:@@core.terrain-layer-toggle.ellipsoid:WGS84 Ellipsoid` }];
  }

}
