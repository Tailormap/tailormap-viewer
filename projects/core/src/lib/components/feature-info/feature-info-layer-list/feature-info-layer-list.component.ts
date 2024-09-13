import { ChangeDetectionStrategy, Component } from '@angular/core';
import { selectFeatureInfoLayerListItems } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';

@Component({
  selector: 'tm-feature-info-layer-list',
  templateUrl: './feature-info-layer-list.component.html',
  styleUrls: ['./feature-info-layer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoLayerListComponent {
  public layers$: Observable<FeatureInfoLayerListItemModel[]>;
  constructor(private store$: Store) {
    this.layers$ = this.store$.select(selectFeatureInfoLayerListItems);
  }
}
