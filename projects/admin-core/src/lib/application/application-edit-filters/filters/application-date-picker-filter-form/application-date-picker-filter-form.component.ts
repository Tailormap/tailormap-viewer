import { Component, OnInit, ChangeDetectionStrategy, input, computed, Input, EventEmitter, Output, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AttributeType, EditFilterConfigurationModel, FilterConditionEnum, FilterToolEnum, UpdateDatePickerFilterModel,
} from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { DateTime } from 'luxon';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';

@Component({
    selector: 'tm-admin-application-date-picker-filter-form',
    templateUrl: './application-date-picker-filter-form.component.html',
    styleUrls: ['./application-date-picker-filter-form.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        MatInput,
        MatDatepickerInput,
        MatDatepickerToggle,
        MatSuffix,
        MatDatepicker,
    ],
})
export class ApplicationDatePickerFilterFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  public attributeType = input<AttributeType>(AttributeType.INTEGER);
  public filterConditions = computed(() => {
    const attributeType = this.attributeType();
    return AttributeFilterHelper.getConditionTypes().filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  });

  @Input()
  public set datePickerFilter(
    configuration: EditFilterConfigurationModel | null,
  ) {
    if (configuration && configuration.filterTool === FilterToolEnum.DATE_PICKER) {
      this.datePickerFilterForm.patchValue({
        condition: configuration.condition,
        initialDate: configuration.initialDate ? DateTime.fromISO(configuration.initialDate) : undefined,
        initialLowerDate: configuration.initialLowerDate ? DateTime.fromISO(configuration.initialLowerDate) : undefined,
        initialUpperDate: configuration.initialUpperDate ? DateTime.fromISO(configuration.initialUpperDate) : undefined,
      }, { emitEvent: false });
    }
  }

  @Output()
  public updateDatePickerFilter = new EventEmitter<UpdateDatePickerFilterModel>();

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
          initialDate: value.initialDate?.toISO() ?? undefined,
          initialLowerDate: value.initialLowerDate?.toISO() ?? undefined,
          initialUpperDate: value.initialUpperDate?.toISO() ?? undefined,
        });
      });
  }

  public isBetweenCondition(): boolean {
    return this.datePickerFilterForm.get('condition')?.value === FilterConditionEnum.DATE_BETWEEN_KEY;
  }

}
