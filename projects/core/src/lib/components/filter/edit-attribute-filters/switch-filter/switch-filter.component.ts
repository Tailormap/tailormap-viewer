import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { SwitchFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-switch-filter',
  templateUrl: './switch-filter.component.html',
  styleUrls: ['./switch-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SwitchFilterComponent {

  @Input()
  public switchFilterConfiguration: SwitchFilterModel | null = null;

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
