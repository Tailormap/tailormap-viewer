import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, FilterConditionEnum, FilterToolEnum, SliderFilterInputModeEnum, UniqueValuesService,
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

  public isSliderFilter(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER;
  }

  public isCheckboxFilter(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.CHECKBOX;
  }

  public isSwitchFilter(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.SWITCH;
  }

  public isDatePickerFilter(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.DATE_PICKER;
  }

  public isDropdownListFilter(filter: AttributeFilterModel): boolean {
    return filter.editConfiguration?.filterTool === FilterToolEnum.DROPDOWN_LIST;
  }

  public getSubstringFilters(filter: AttributeFilterModel): { id: string; disabled: boolean }[] {
    return this.editableFilters()
      .filter(f => f.id.startsWith(`${filter.id}-substring-`))
      .map(f => ({ id: f.id, disabled: f.disabled ?? false }));
  }

  public getConditionLabel(condition: FilterConditionEnum): string {
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === condition)?.label || '';
  }

  public getSliderFilterLabel(filter: AttributeFilterModel): string {
    if (filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER
      && filter.editConfiguration.inputMode !== SliderFilterInputModeEnum.SLIDER) {
      return `${filter.attribute} ${filter.condition}`;
    }
    const formattedValues = filter.value.map(value => {
      const num = Number(value);
      return isNaN(num) ? value : num.toPrecision(5);
    });
    return `${filter.attribute} ${filter.condition} ${formattedValues.join($localize `:@@core.filter.slider-and: and `)}`;
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

}
