import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { BooleanFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BooleanFilterComponent {

  @Input()
  public booleanFilterConfiguration: BooleanFilterModel | null = null;

  @Output()
  public valueChange = new EventEmitter<boolean>();

  constructor() { }

  public chooseValue(value: boolean) {
    this.valueChange.emit(value);
  }

  public getLabel1(): string {
    return this.booleanFilterConfiguration?.alias1 ?? this.booleanFilterConfiguration?.value1 ?? $localize `:@@core.filter.boolean-filter.true:True`;
  }

  public getLabel2(): string {
    return this.booleanFilterConfiguration?.alias2 ?? this.booleanFilterConfiguration?.value2 ?? $localize `:@@core.filter.boolean-filter.false:False`;
  }

}
