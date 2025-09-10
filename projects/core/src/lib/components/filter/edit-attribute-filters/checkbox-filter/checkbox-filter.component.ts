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
    this.label = config.filter.attribute;
  }

  @Output()
  public valueChecked = new EventEmitter<{ value: string; checked: boolean; substringFilter: boolean }>();

  constructor() { }

  public checkValue(value: AttributeValueSettings, checked: boolean) {
    this.valueChecked.emit({ value: value.value, checked, substringFilter: value.useAsIlikeSubstringFilter ?? false });
  }

}
