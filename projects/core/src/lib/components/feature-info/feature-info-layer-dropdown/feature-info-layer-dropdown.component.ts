import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { selectFeatureInfoLayerListItems } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';
import { map } from 'rxjs';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { FeatureInfoLayerItemComponent } from '../feature-info-layer-item/feature-info-layer-item.component';

@Component({
    selector: 'tm-feature-info-layer-dropdown',
    templateUrl: './feature-info-layer-dropdown.component.html',
    styleUrls: ['./feature-info-layer-dropdown.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormField,
        MatSelect,
        ReactiveFormsModule,
        MatOption,
        FeatureInfoLayerItemComponent,
    ],
})
export class FeatureInfoLayerDropdownComponent {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  public layers = signal<FeatureInfoLayerListItemModel[]>([]);
  public layerSelector = new FormControl<string | null>(null);

  constructor() {
    this.store$
      .select(selectFeatureInfoLayerListItems)
      .pipe(
        map(layers => layers.filter(layer => layer.totalCount !== 0)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(layers => {
        this.layerSelector.patchValue(layers.find(layer => layer.selected)?.id ?? null);
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
