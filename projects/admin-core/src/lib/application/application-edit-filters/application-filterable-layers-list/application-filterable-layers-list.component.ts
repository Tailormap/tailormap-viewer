import {
  Component, ChangeDetectionStrategy, EventEmitter, Output, Signal, computed, OnDestroy,
} from '@angular/core';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { Store } from '@ngrx/store';
import { selectApplicationSelectedFilterLayerId, selectFilterableLayersForApplication } from '../../state/application.selectors';
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
  public selectedLayerId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterLayerId);
  public filterableLayersWithSelected = computed(() => {
    const filterableLayers = this.filterableLayers();
    const selectedLayerId = this.selectedLayerId();
    return filterableLayers.map(layer => {
      return {
        ...layer,
        isSelected: layer.appLayerId === selectedLayerId,
      };
    });
  });

  @Output()
  public selectLayer = new EventEmitter<GeoServiceLayerInApplicationModel>();

  constructor(private store$: Store) { }

  public setSelectedLayer(layer: GeoServiceLayerInApplicationModel) {
    if (!layer) {
      return;
    }
    this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: layer.appLayerId }));
    this.selectLayer.emit(layer);
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: undefined }));
  }

}
