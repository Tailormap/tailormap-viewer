import { Component, OnInit, ChangeDetectionStrategy, input, computed, Input, EventEmitter, Output, DestroyRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, UpdateDatePickerFilterModel, UpdateSliderFilterModel,
  UpdateSwitchFilterModel,
} from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { DateTime } from 'luxon';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-application-date-picker-filter-form',
  templateUrl: './application-date-picker-filter-form.component.html',
  styleUrls: ['./application-date-picker-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationDatePickerFilterFormComponent implements OnInit {

  public attributeType = input<AttributeType>(AttributeType.INTEGER);
  public filterConditions = computed(() => {
    const attributeType = this.attributeType();
    return AttributeFilterHelper.getConditionTypes().filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  });

  @Input()
  public set datePickerFilter(
    configuration: UpdateSliderFilterModel | CheckboxFilterModel | UpdateSwitchFilterModel  | UpdateDatePickerFilterModel | null,
  ) {
    if (configuration && configuration.filterTool === FilterToolEnum.DATE_PICKER) {
      this.datePickerFilterForm.patchValue({
        condition: configuration.condition,
        initialDate: configuration.initialDate,
        initialLowerDate: configuration.initialLowerDate,
        initialUpperDate: configuration.initialUpperDate,
      }, { emitEvent: false });
    }
  }

  @Output()
  public updateDatePickerFilter = new EventEmitter<UpdateDatePickerFilterModel>();

  constructor(private destroyRef: DestroyRef) { }

  public datePickerFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum | null>(null),
    initialDate: new FormControl<DateTime | null>(null),
    initialLowerDate: new FormControl<DateTime | null>(null),
    initialUpperDate: new FormControl<DateTime | null>(null),
  });

  public ngOnInit(): void {
    this.datePickerFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        this.updateDatePickerFilter.emit({
          filterTool: FilterToolEnum.DATE_PICKER,
          condition: value.condition ?? FilterConditionEnum.DATE_ON_KEY,
          initialDate: value.initialDate ?? undefined,
          initialLowerDate: value.initialLowerDate ?? undefined,
          initialUpperDate: value.initialUpperDate ?? undefined,
        });
      });
  }

  public isBetweenCondition(): boolean {
    return this.datePickerFilterForm.get('condition')?.value === FilterConditionEnum.DATE_BETWEEN_KEY;
  }

}
