import { inject, Injectable } from '@angular/core';
import { combineLatest } from 'rxjs';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { FilterManagerService } from '../../../filter/services/filter-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ReferenceLayerService {
  private store$ = inject(Store);
  private filterManagerService = inject(FilterManagerService);
  public referencableLayers$ = combineLatest([
    this.filterManagerService.referencableLayers$,
    this.store$.select(selectSelectedLayers),
  ]).pipe(
    map(([ layers, selectedLayers ]) => layers.filter(layer => !selectedLayers.includes(layer.id))),
  );
}
