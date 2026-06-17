import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AttributeFilterModel, AttributeValueSettings, FilterToolEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-checkbox-filter',
  templateUrl: './checkbox-filter.component.html',
  styleUrls: ['./checkbox-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CheckboxFilterComponent {

  public label: string = '';
  public attributeValuesSettings: AttributeValueSettings[] = [];

  @Input()
  public set checkboxFilter(config: {filter: AttributeFilterModel; substringFilters: { id: string; disabled: boolean }[]}) {
    if (config.filter?.editConfiguration?.filterTool !== FilterToolEnum.CHECKBOX) {
      return;
    }
    this.attributeValuesSettings = config.filter.editConfiguration.attributeValuesSettings.map(valueSettings => {
      if (valueSettings.useAsIlikeSubstringFilter) {
        const substringFilterId = `${config.filter.id}-substring-${valueSettings.value}`;
        const substringFilter = config.substringFilters.find(f => f.id === substringFilterId);
        return {
          ...valueSettings,
          initiallySelected: substringFilter ? !substringFilter.disabled : false,
        };
      }
      return {
        ...valueSettings,
        initiallySelected: config.filter.value.includes(valueSettings.value),
      };
    });
    this.label = config.filter.attributeAlias || config.filter.attribute;
  }

  @Output()
  public valueChecked = new EventEmitter<{ value: string; checked: boolean; substringFilter: boolean }>();

  @Output()
  public allValuesChecked = new EventEmitter<{ checked: boolean; regularValues: string[]; substringValues: string[] }>();

  constructor() { }

  public checkValue(value: AttributeValueSettings, checked: boolean) {
    this.valueChecked.emit({ value: value.value, checked, substringFilter: value.useAsIlikeSubstringFilter ?? false });
  }

  public someValuesSelected(): boolean {
    return this.attributeValuesSettings.some(v => v.selectable && v.initiallySelected);
  }

  public toggleAll() {
    const checked = !this.someValuesSelected();
    const selectableValues = this.attributeValuesSettings.filter(v => v.selectable);
    const regularValues = selectableValues.filter(v => !v.useAsIlikeSubstringFilter).map(v => v.value);
    const substringValues = selectableValues.filter(v => v.useAsIlikeSubstringFilter).map(v => v.value);
    this.allValuesChecked.emit({ checked, regularValues, substringValues });
  }

  public getToggleAllTooltip(): string {
    return this.someValuesSelected()
      ? $localize `:@@core.filter.checkbox.uncheck-all:Uncheck all values`
      : $localize `:@@core.filter.checkbox.check-all:Check all values`;
  }

}
