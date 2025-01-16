import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FeatureInfoService } from '../feature-info.service';
import { Store } from '@ngrx/store';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';

@Component({
  selector: 'tm-feature-info-layer-item',
  templateUrl: './feature-info-layer-item.component.html',
  styleUrls: ['./feature-info-layer-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoLayerItemComponent {

  @Input()
  public layer: FeatureInfoLayerListItemModel | undefined;

  public defaultErrorMessage = FeatureInfoService.LOAD_FEATURE_INFO_ERROR;

  constructor(
    private store$: Store,
  ) {}

  public selectLayer(layer: FeatureInfoLayerListItemModel) {
    if (layer.disabled) {
      return;
    }
    this.store$.dispatch(setSelectedFeatureInfoLayer({ layer: layer.id }));
  }

}
