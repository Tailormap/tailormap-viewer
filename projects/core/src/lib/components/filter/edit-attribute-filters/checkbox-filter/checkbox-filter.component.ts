import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { AttributeValueSettings, CheckboxFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-checkbox-filter',
  templateUrl: './checkbox-filter.component.html',
  styleUrls: ['./checkbox-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CheckboxFilterComponent {

  @Input()
  public label: string = '';

  @Input()
  public checkboxFilterConfiguration: CheckboxFilterModel | null = null;

  @Output()
  public valueChecked = new EventEmitter<{ value: string; checked: boolean; substringFilter: boolean }>();

  constructor() { }

  public checkValue(value: AttributeValueSettings, checked: boolean) {
    this.valueChecked.emit({ value: value.value, checked, substringFilter: value.useAsIlikeSubstringFilter ?? false });
  }

}
