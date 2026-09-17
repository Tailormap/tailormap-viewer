import { inject, Injectable } from '@angular/core';
import { combineLatest } from 'rxjs';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { DataSourceManagerService } from '../../../services';

@Injectable({
  providedIn: 'root',
})
export class ReferenceLayerService {
  private store$ = inject(Store);
  private dataSourceManagerService = inject(DataSourceManagerService);
  public referencableLayers$ = combineLatest([
    this.dataSourceManagerService.layersWithAttributes$,
    this.store$.select(selectSelectedLayers),
  ]).pipe(
    map(([ layers, selectedLayers ]) => layers.filter(layer => !selectedLayers.includes(layer.id))),
  );
}
