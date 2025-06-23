import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, SwitchFilterModel, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, SliderFilterModel,
} from '@tailormap-viewer/api';
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
    const editConfiguration = filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER ? { ...filter.editConfiguration } : null;
    if (editConfiguration && editConfiguration.initialValue !== null) {
      editConfiguration.initialValue = Number(filter.value[0]);
    } else if (editConfiguration && editConfiguration.initialLowerValue !== null && editConfiguration.initialUpperValue !== null) {
      editConfiguration.initialLowerValue = Number(filter.value[0]);
      editConfiguration.initialUpperValue = Number(filter.value[1]);
    }
    return editConfiguration;
  }

  public getCheckboxFilterConfiguration(filter: AttributeFilterModel): CheckboxFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.CHECKBOX) {
      return null;
    }
    return {
      ...filter.editConfiguration,
      attributeValuesSettings: filter.editConfiguration.attributeValuesSettings.map(valueSettings => ({
        ...valueSettings,
        initiallySelected: filter.value.includes(valueSettings.value),
      })),
    };
  }

  public getSwitchFilterConfiguration(filter: AttributeFilterModel): SwitchFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.SWITCH) {
      return null;
    }
    return filter.editConfiguration;
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

  public getSliderFilterLabel(filter: AttributeFilterModel): string {
    return `${filter.attribute} ${filter.condition} ${filter.value.join($localize `:@@core.filter.slider-and: and `)}`;
  }

  public updateSwitchFilterValue(change: boolean, filter: AttributeFilterModel) {
    if (filter.attributeType === AttributeType.BOOLEAN) {
      const condition = change ? FilterConditionEnum.BOOLEAN_TRUE_KEY : FilterConditionEnum.BOOLEAN_FALSE_KEY;
      const newFilter: AttributeFilterModel = {
        ...filter,
        condition,
      };
      if (this.filterGroupId()) {
        this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
      }
    } else if (filter.editConfiguration?.filterTool === FilterToolEnum.SWITCH) {
      const newValue = change ? filter.editConfiguration.value1 : filter.editConfiguration.value2;
      const newFilter: AttributeFilterModel = {
        ...filter,
        value: [newValue || ''],
      };
      if (this.filterGroupId()) {
        this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
      }
    }
  }
}
