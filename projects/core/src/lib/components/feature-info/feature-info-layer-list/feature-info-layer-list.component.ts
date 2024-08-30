import { ChangeDetectionStrategy, Component } from '@angular/core';
import { selectFeatureInfoLayers, selectSelectedLayerId } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { LoadingStateEnum } from "@tailormap-viewer/shared";

interface FeatureInfoLayerListItem extends FeatureInfoLayerModel {
  disabled: boolean;
  selected: boolean;
}

@Component({
  selector: 'tm-feature-info-layer-list',
  templateUrl: './feature-info-layer-list.component.html',
  styleUrls: ['./feature-info-layer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoLayerListComponent {

  public layers$: Observable<FeatureInfoLayerListItem[]>;

  constructor(private store$: Store) {
    this.layers$ = combineLatest([
      this.store$.select(selectFeatureInfoLayers),
      this.store$.select(selectSelectedLayerId),
    ]).pipe(
      map(([ layers, selectedLayerId ]) => layers.map(l => ({
        ...l,
        disabled: this.isDisabled(l),
        selected: l.id === selectedLayerId,
      }))),
    );
  }

  public selectLayer(layer: FeatureInfoLayerListItem) {
    if (layer.disabled) {
      return;
    }
    this.store$.dispatch(setSelectedFeatureInfoLayer({ layer: layer.id }));
  }

  private isDisabled(layer: FeatureInfoLayerModel) {
    if (layer.loading === LoadingStateEnum.LOADED || layer.loading === LoadingStateEnum.FAILED) {
      return layer.totalCount === 0;
    }
    return false;
  }
}
