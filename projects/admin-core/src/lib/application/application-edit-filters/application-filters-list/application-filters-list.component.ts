import { Component, ChangeDetectionStrategy, Signal, computed, OnDestroy, signal } from '@angular/core';
import { AttributeFilterModel, FilterConditionEnum, FilterGroupModel } from '@tailormap-viewer/api';
import {
  selectApplicationSelectedFilterId, selectApplicationSelectedFilterLayerId, selectFilterableLayersForApplication, selectFilterGroups,
  selectSelectedApplicationId,
} from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { setApplicationSelectedFilterId, updateApplicationFiltersConfig } from '../../state/application.actions';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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

  public isDragging = signal<boolean>(false);

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

  public getConditionLabel(condition: FilterConditionEnum): string {
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === condition)?.label || '';
  }

  public drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const filters = this.filters().map(filter => filter.filter);
    const movedFilterId = filters[event.previousIndex].id;
    moveItemInArray(filters, event.previousIndex, event.currentIndex);
    const filterGroup = this.filterGroups().find(group =>
      group.filters.some(filter => filter.id === movedFilterId));
    const filterGroupFilterIds = filterGroup?.filters.map(filter => filter.id) || [];
    const filtersInGroup = filters.filter(filter => filterGroupFilterIds.includes(filter.id));
    const newFilterGroups: FilterGroupModel<AttributeFilterModel>[] = this.filterGroups().map(group => {
      if (group.id === filterGroup?.id) {
        return {
          ...group,
          filters: filtersInGroup,
        };
      }
      return group;
    });
    this.store$.dispatch(updateApplicationFiltersConfig({ filterGroups: newFilterGroups }));
  }

}
