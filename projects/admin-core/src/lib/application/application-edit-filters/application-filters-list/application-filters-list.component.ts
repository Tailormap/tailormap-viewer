import { Component, ChangeDetectionStrategy, Signal, computed, input, InputSignal, OnDestroy } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { selectApplicationSelectedFilterId, selectFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { setApplicationSelectedFilterId } from '../../state/application.actions';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent implements OnDestroy {


  public selectedLayer: InputSignal<GeoServiceLayerInApplicationModel | undefined> = input<GeoServiceLayerInApplicationModel>();
  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);
  public selectedFilterId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterId);

  public filters = computed(() => {
    let filterGroups = this.filterGroups();
    const selectedLayer = this.selectedLayer();
    const selectedFilterId = this.selectedFilterId();
    if (selectedLayer) {
      filterGroups = filterGroups.filter(group => group.layerIds.includes(selectedLayer.appLayerId));
    }
    return filterGroups.reduce((acc, group) => {
      return acc.concat(group.filters.map(filter => ({
        filter,
        selected: filter.id === selectedFilterId,
      })));
    }, [] as { filter: AttributeFilterModel; selected: boolean }[]);
  });

  constructor(private store$: Store) {}

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

}
