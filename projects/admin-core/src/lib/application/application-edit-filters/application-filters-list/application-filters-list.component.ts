import { ChangeDetectionStrategy, Component, computed, OnDestroy, Signal } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel, FilterToolEnum } from '@tailormap-viewer/api';
import {
  selectApplicationSelectedFilterId, selectApplicationSelectedFilterLayerId, selectFilterableLayersForApplication, selectFilterGroups,
  selectSelectedApplicationId,
} from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { setApplicationSelectedFilterId } from '../../state/application.actions';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent implements OnDestroy {

  public selectedLayerId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterLayerId);
  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);
  public selectedFilterId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterId);

  public selectedLayer: Signal<GeoServiceLayerInApplicationModel | undefined> = computed(() => {
    const selectedLayerId = this.selectedLayerId();
    const filterableLayers = this.filterableLayers();
    if (!selectedLayerId) {
      return undefined;
    }
    return filterableLayers.find(layer => layer.appLayerId === selectedLayerId);
  });

  public filters = computed(() => {
    let filterGroups = this.filterGroups();
    const selectedLayer = this.selectedLayer();
    const selectedFilterId = this.selectedFilterId();
    if (selectedLayer) {
      filterGroups = filterGroups.filter(group => group.layerIds.includes(selectedLayer.appLayerId));
    }
    return filterGroups.reduce<{ filter: AttributeFilterModel; selected: boolean }[]>((acc, group) => {
      return acc.concat(group.filters.map(filter => ({
        filter,
        selected: filter.id === selectedFilterId,
      })));
    }, []);
  });

  constructor(private store$: Store) {}

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

  public getFilterLabel(attributeFilter: AttributeFilterModel): string {
    if (attributeFilter.editConfiguration) {
      const filterTool = attributeFilter.editConfiguration.filterTool;
      if (filterTool === FilterToolEnum.SLIDER) {
        return $localize`:@@admin-core.application.filters.slider:Slider`;
      } else if (filterTool === FilterToolEnum.CHECKBOX) {
        return $localize`:@@admin-core.application.filters.checkbox:Checkbox`;
      } else if (filterTool === FilterToolEnum.BOOLEAN) {
        return $localize`:@@admin-core.application.filters.boolean:Boolean`;
      }
    }
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === attributeFilter.condition)?.label || '';
  }

}
