import { ChangeDetectionStrategy, Component, OnDestroy, signal, Signal } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum } from '@tailormap-viewer/api';
import { selectFiltersForSelectedGroup } from '../../../state/application.selectors';
import { Store } from '@ngrx/store';
import {
  setApplicationSelectedFilterId, updateApplicationFiltersConfigForSelectedGroup,
} from '../../../state/application.actions';
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

  public filters: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = this.store$.selectSignal(selectFiltersForSelectedGroup);

  public isDragging = signal<boolean>(false);

  constructor(private store$: Store) {}

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

  public setSelectedFilterId(id: string) {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: id }));
  }

  public getFilterLabel(attributeFilter: AttributeFilterModel): string {
    if (attributeFilter.editConfiguration) {
      const filterTool = attributeFilter.editConfiguration.filterTool;
      if (filterTool === FilterToolEnum.SLIDER) {
        return $localize`:@@admin-core.application.filters.numeric:Numeric`;
      } else if (filterTool === FilterToolEnum.CHECKBOX) {
        return $localize`:@@admin-core.application.filters.checkbox:Checkbox`;
      } else if (filterTool === FilterToolEnum.SWITCH) {
        return $localize`:@@admin-core.application.filters.switch:Switch`;
      } else if (filterTool === FilterToolEnum.DATE_PICKER) {
        return $localize`:@@admin-core.application.filters.date-picker:Date Picker`;
      }
    }
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === attributeFilter.condition)?.label || '';
  }

  public drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const filters = this.filters().map(filter => filter.filter);
    moveItemInArray(filters, event.previousIndex, event.currentIndex);
    this.store$.dispatch(updateApplicationFiltersConfigForSelectedGroup({ filters }));
  }

}
