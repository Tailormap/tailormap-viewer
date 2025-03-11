import { Component, ChangeDetectionStrategy, Signal, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, combineLatest } from 'rxjs';
import {
  selectBackgroundNodesList, selectIn3DView, selectInitiallySelectedBackgroundNodes, selectLayersWithoutWebMercatorIds,
  selectSelectedBackgroundNodeId,
} from '../../map/state/map.selectors';
import { SplitButtonOptionModel } from '@tailormap-viewer/shared';
import { setSelectedBackgroundNodeId } from '../../map/state/map.actions';

@Component({
  selector: 'tm-background-layer-toggle',
  templateUrl: './background-layer-toggle.component.html',
  styleUrls: ['./background-layer-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BackgroundLayerToggleComponent {

  public selectedBackgroundNodeId$: Observable<string | undefined>;
  public backgroundLayers$: Observable<SplitButtonOptionModel[]>;
  public initiallyCheckedLabels$: Observable<string>;

  private allowEmptyBackground = true;

  public in3D: Signal<boolean> = signal(false);
  public layersWithoutWebMercator: Signal<string[]> = signal([]);

  constructor(
    private store$: Store,
  ) {
    this.selectedBackgroundNodeId$ = combineLatest([
      this.store$.select(selectInitiallySelectedBackgroundNodes),
      this.store$.select(selectSelectedBackgroundNodeId),
    ]).pipe(
      map(([ initiallySelectedBackgroundNodes, selectedBackgroundNodeId ]) => {
        return selectedBackgroundNodeId ||
          (initiallySelectedBackgroundNodes.length === 1
            ? initiallySelectedBackgroundNodes[0].id
            : undefined);
      }));
    this.backgroundLayers$ = this.store$.select(selectBackgroundNodesList).pipe(
      map(nodes => this.getEmptyOption().concat([
        ...nodes.map(node => ({ id: node.id, label: node.name })),
      ])),
    );
    this.initiallyCheckedLabels$ = this.store$.select(selectInitiallySelectedBackgroundNodes).pipe(
      map(nodes => nodes.map(node => node.name).join(', ')),
    );
    this.in3D = this.store$.selectSignal(selectIn3DView);
    this.layersWithoutWebMercator = this.store$.selectSignal(selectLayersWithoutWebMercatorIds);
  }

  public backgroundChanged(id: string) {
    this.store$.dispatch(setSelectedBackgroundNodeId({ id }));
  }

  private getEmptyOption(): SplitButtonOptionModel[] {
    if (!this.allowEmptyBackground) {
      return [];
    }
    return [{ id: 'EMPTY_BACKGROUND', label: $localize `:@@core.background-layer-toggle.no-basemap:No basemap` }];
  }

}
