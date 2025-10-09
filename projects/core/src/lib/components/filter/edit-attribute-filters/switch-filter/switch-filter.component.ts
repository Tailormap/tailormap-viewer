import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterToolEnum, SwitchFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-switch-filter',
  templateUrl: './switch-filter.component.html',
  styleUrls: ['./switch-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SwitchFilterComponent {

  public switchFilterConfiguration?: SwitchFilterModel;
  public startWithValue2: boolean = false;

  @Input()
  public set switchFilter(filter: AttributeFilterModel) {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.SWITCH) {
      return;
    }
    this.switchFilterConfiguration = filter.editConfiguration;
    if (filter.attributeType === AttributeType.BOOLEAN) {
      this.startWithValue2 = filter.condition === FilterConditionEnum.BOOLEAN_FALSE_KEY;
    } else {
      this.startWithValue2 = filter.value[0] === filter.editConfiguration.value2;
    }
  };

  @Output()
  public valueChange = new EventEmitter<boolean>();

  constructor() { }

  public chooseValue(value: boolean) {
    this.valueChange.emit(value);
  }

  public getLabel1(): string {
    return this.switchFilterConfiguration?.alias1 ?? this.switchFilterConfiguration?.value1 ?? $localize `:@@core.filter.switch-filter.true:True`;
  }

  public getLabel2(): string {
    return this.switchFilterConfiguration?.alias2 ?? this.switchFilterConfiguration?.value2 ?? $localize `:@@core.filter.switch-filter.false:False`;
  }

}
