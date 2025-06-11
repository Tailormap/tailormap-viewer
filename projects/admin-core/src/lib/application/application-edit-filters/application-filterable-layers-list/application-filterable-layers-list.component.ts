import {
  Component, ChangeDetectionStrategy, Signal, computed, OnDestroy,
} from '@angular/core';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { Store } from '@ngrx/store';
import { selectApplicationSelectedFilterLayerIds, selectFilterableLayersForApplication } from '../../state/application.selectors';
import { setApplicationSelectedFilterLayerId } from '../../state/application.actions';

@Component({
  selector: 'tm-admin-filterable-layers-list',
  templateUrl: './application-filterable-layers-list.component.html',
  styleUrls: ['./application-filterable-layers-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterableLayersListComponent implements OnDestroy {

  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public selectedLayerIds: Signal<string[] | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterLayerIds);
  public filterableLayersWithSelected = computed(() => {
    const filterableLayers = this.filterableLayers();
    const selectedLayerIds = this.selectedLayerIds();
    return filterableLayers.map(layer => {
      return {
        ...layer,
        isSelected: selectedLayerIds?.includes(layer.appLayerId),
      };
    });
  });

  constructor(private store$: Store) { }

  public setSelectedLayer(layer: GeoServiceLayerInApplicationModel, selected: boolean) {
    if (!layer) {
      return;
    }
    this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: layer.appLayerId, selected: selected }));
  }

  public ngOnDestroy(): void {
    const layersIds = this.selectedLayerIds();
    layersIds?.forEach(layerId => {
      this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: layerId, selected: false }));
    });
  }

}
