import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { selectFeatureInfoLayerListItems } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';

@Component({
  selector: 'tm-feature-info-layer-dropdown',
  templateUrl: './feature-info-layer-dropdown.component.html',
  styleUrls: ['./feature-info-layer-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoLayerDropdownComponent {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  public layers = signal<FeatureInfoLayerListItemModel[]>([]);
  public layerSelector = new FormControl<string | null>(null);

  constructor() {
    this.store$.select(selectFeatureInfoLayerListItems)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layers => {
        this.layerSelector.patchValue(layers.find(l => l.selected)?.id ?? null);
        this.layers.set(layers);
      });
    this.layerSelector.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        if (layer) {
          this.store$.dispatch(setSelectedFeatureInfoLayer({ layer }));
        }
      });
  }

}
