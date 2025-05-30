import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AttributeFilterModel, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, SliderFilterModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { updateFilter } from '../../../filter/state/filter.actions';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-edit-attribute-filter',
  templateUrl: './edit-attribute-filters.component.html',
  styleUrls: ['./edit-attribute-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttributeFiltersComponent {

  public editableFilters = input<AttributeFilterModel[]>([]);
  public filterGroupId = input<string | null>(null);

  constructor(private store$: Store) { }

  public getSliderFilterConfiguration(filter: AttributeFilterModel): SliderFilterModel | null {
    return filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER ? filter.editConfiguration : null;
  }

  public getCheckboxFilterConfiguration(filter: AttributeFilterModel): CheckboxFilterModel | null {
    return filter.editConfiguration?.filterTool === FilterToolEnum.CHECKBOX ? filter.editConfiguration : null;
  }

  public updateSliderFilterValue($event: number, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [`${$event}`],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateBetweenSliderFilterValues($event: { lower: number; upper: number }, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [ `${$event.lower}`, `${$event.upper}` ],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateCheckboxFilterValue(value: string, checked: boolean, filter: AttributeFilterModel) {
    let newValue: string[];
    if (checked && !filter.value.includes(value)) {
      newValue = [ ...filter.value, value ];
    } else if (!checked && filter.value.includes(value)) {
      newValue = filter.value.filter(v => v !== value);
    } else {
      newValue = filter.value;
    }
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: newValue,
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public getConditionLabel(condition: FilterConditionEnum): string {
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === condition)?.label || '';
  }

}
