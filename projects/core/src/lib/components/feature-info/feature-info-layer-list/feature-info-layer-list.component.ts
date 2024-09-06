import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { selectFeatureInfoLayerListItems } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';

@Component({
  selector: 'tm-feature-info-layer-list',
  templateUrl: './feature-info-layer-list.component.html',
  styleUrls: ['./feature-info-layer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoLayerListComponent {

  public layers$: Observable<FeatureInfoLayerListItemModel[]>;
  public layerSelector = new FormControl<string | null>(null);
  public isSmallScreen$: Observable<boolean>;

  constructor(
    private store$: Store,
    public breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef,
  ) {
    this.layers$ = this.store$.select(selectFeatureInfoLayerListItems);
    this.layers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layers => {
        this.layerSelector.patchValue(layers.find(l => l.selected)?.id ?? null);
      });
    this.layerSelector.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        if (layer) {
          this.store$.dispatch(setSelectedFeatureInfoLayer({ layer }));
        }
      });
    this.isSmallScreen$ = this.breakpointObserver.observe('(max-width: 700px)')
      .pipe(map(match => match.matches));
  }

}
