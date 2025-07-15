import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CheckboxFilterModel } from '@tailormap-viewer/api';

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
  public valueChecked = new EventEmitter<{ value: string; checked: boolean }>();

  constructor() { }

  public checkValue(value: string, checked: boolean) {
    this.valueChecked.emit({ value, checked });
  }

}
