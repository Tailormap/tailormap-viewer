import { ChangeDetectionStrategy, Component, OnDestroy, signal, Signal } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel, FilterToolEnum } from '@tailormap-viewer/api';
import {
  selectFilterGroups, selectFiltersForApplication, selectSelectedApplicationId, selectSelectedLayerForApplication,
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

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);
  public selectedLayer: Signal<GeoServiceLayerInApplicationModel | undefined> = this.store$.selectSignal(selectSelectedLayerForApplication);
  public filters: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = this.store$.selectSignal(selectFiltersForApplication);

  public isDragging = signal<boolean>(false);

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
      } else if (filterTool === FilterToolEnum.SWITCH) {
        return $localize`:@@admin-core.application.filters.switch:Switch`;
      }
    }
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === attributeFilter.condition)?.label || '';
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
