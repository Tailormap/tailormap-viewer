import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { selectFeatureInfoLayerListItems } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';
import { FeatureInfoLayerItemComponent } from '../feature-info-layer-item/feature-info-layer-item.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-feature-info-layer-list',
    templateUrl: './feature-info-layer-list.component.html',
    styleUrls: ['./feature-info-layer-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ FeatureInfoLayerItemComponent, AsyncPipe ],
})
export class FeatureInfoLayerListComponent {
  private store$ = inject(Store);

  public layers$: Observable<FeatureInfoLayerListItemModel[]>;
  constructor() {
    this.layers$ = this.store$.select(selectFeatureInfoLayerListItems);
  }
}
