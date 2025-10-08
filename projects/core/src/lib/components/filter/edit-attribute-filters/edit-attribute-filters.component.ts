import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum,
  SwitchFilterModel, DatePickerFilterModel, SliderFilterInputModeEnum, DropdownListFilterModel, UniqueValuesService,
  UpdateSliderFilterModel,
} from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { setSingleFilterDisabled, updateFilter } from '../../../filter/state/filter.actions';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { DateTime } from 'luxon';
import { forkJoin, map, Observable, switchMap, take } from 'rxjs';
import { selectViewerId } from '../../../state/core.selectors';


@Component({
  selector: 'tm-edit-attribute-filter',
  templateUrl: './edit-attribute-filters.component.html',
  styleUrls: ['./edit-attribute-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttributeFiltersComponent {
  private store$ = inject(Store);
  private uniqueValuesService = inject(UniqueValuesService);


  public editableFilters = input<AttributeFilterModel[]>([]);
  public filterGroupId = input<string | null>(null);
  public layerIds = input<string[]>([]);
  public onlyGroupInList = input<boolean>(false);

  public getSliderFilterConfiguration(filter: AttributeFilterModel): UpdateSliderFilterModel | null {
    const editConfiguration = filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER ? { ...filter.editConfiguration } : null;
    if (editConfiguration && filter.condition !== FilterConditionEnum.NUMBER_BETWEEN_KEY && filter.value.length === 1) {
      editConfiguration.initialValue = Number(filter.value[0]);
    } else if (editConfiguration && filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY && filter.value.length === 2) {
      editConfiguration.initialLowerValue = Number(filter.value[0]);
      editConfiguration.initialUpperValue = Number(filter.value[1]);
    } else if (editConfiguration) {
      editConfiguration.condition = filter.condition;
    }
    return editConfiguration;
  }

  public getCheckboxFilterConfiguration(filter: AttributeFilterModel): CheckboxFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.CHECKBOX) {
      return null;
    }
    return {
      ...filter.editConfiguration,
      attributeValuesSettings: filter.editConfiguration.attributeValuesSettings.map(valueSettings => {
        if (valueSettings.useAsIlikeSubstringFilter) {
          const substringFilterId = `${filter.id}-substring-${valueSettings.value}`;
          const substringFilter = this.editableFilters().find(f => f.id === substringFilterId);
          return {
            ...valueSettings,
            initiallySelected: substringFilter ? !substringFilter.disabled : false,
          };
        }
        return {
          ...valueSettings,
          initiallySelected: filter.value.includes(valueSettings.value),
        };
      }),
    };
  }

  public getSwitchFilterConfiguration(filter: AttributeFilterModel): SwitchFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.SWITCH) {
      return null;
    }
    return filter.editConfiguration;
  }

  public getDatePickerFilterConfiguration(filter: AttributeFilterModel): DatePickerFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.DATE_PICKER) {
      return null;
    }
    const editConfiguration: DatePickerFilterModel = { ...filter.editConfiguration };
    if (editConfiguration.initialDate) {
      editConfiguration.initialDate = filter.value[0];
    } else if (editConfiguration.initialLowerDate && editConfiguration.initialUpperDate) {
      editConfiguration.initialLowerDate = filter.value[0];
      editConfiguration.initialUpperDate = filter.value[1];
    }
    return editConfiguration;
  }

  public getDropdownListFilterConfiguration(filter: AttributeFilterModel): DropdownListFilterModel | null {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.DROPDOWN_LIST) {
      return null;
    }
    return filter.editConfiguration;
  }

  public updateSliderFilterValue($event: number | null, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [`${$event}`],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateBetweenSliderFilterValues($event: { lower: number | null; upper: number | null }, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [ `${$event.lower}`, `${$event.upper}` ],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateCheckboxFilterValue(value: string, checked: boolean, substringFilter: boolean, filter: AttributeFilterModel) {
    if (substringFilter) {
      this.store$.dispatch(setSingleFilterDisabled({
        filterGroupId: this.filterGroupId() ?? '',
        filterId: `${filter.id}-substring-${value}`,
        disabled: !checked,
      }));
      return;
    }
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
    if (filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER
      && filter.editConfiguration.inputMode !== SliderFilterInputModeEnum.SLIDER) {
      return `${filter.attributeAlias ?? filter.attribute} ${filter.condition}`;
    }
    const formattedValues = filter.value.map(value => {
      const num = Number(value);
      if (isNaN(num)) {
        return value;
      } else {
        return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 5 }).format(num);
      }
    });
    return `${filter.attributeAlias ?? filter.attribute} ${filter.condition} ${formattedValues.join($localize `:@@core.filter.slider-and: and `)}`;
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

  public updateDateFilterValue($event: DateTime, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [$event.toISO() ?? ''],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateBetweenDateFilterValues($event: { lower: DateTime; upper: DateTime }, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [ $event.lower.toISO() ?? '', $event.upper.toISO() ?? '' ],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public getUniqueValues$(attribute: string): Observable<string[]> {
    const layerIds = this.layerIds();
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(viewerId => {
        if (!layerIds || layerIds.length === 0 || !viewerId) {
          return [];
        }
        return forkJoin(
          layerIds.map(layerId =>
            this.uniqueValuesService.getUniqueValues$({
              attribute: attribute,
              layerId: layerId,
              applicationId: viewerId,
            }).pipe(
              take(1),
              map(response => response.values.map(v => `${v}`) || []),
            ),
          ),
        ).pipe(
          map((allLayerValues: string[][]) => Array.from(new Set(allLayerValues.flat()))),
        );
      }),
    );
  }

  public isSliderFilterDisabled(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER && filter.value.length === 0;
  }

}
