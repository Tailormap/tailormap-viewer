import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { DateTime } from 'luxon';
import { AttributeFilterModel, FilterConditionEnum, FilterToolEnum } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-date-picker-filter',
  templateUrl: './date-picker-filter.component.html',
  styleUrls: ['./date-picker-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DatePickerFilterComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  public isBetweenCondition: boolean = false;
  public label: string = '';
  public labelFromValue: string = '';
  public labelUntilValue: string = '';

  @Input()
  public set datePickerFilter(filter: AttributeFilterModel) {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.DATE_PICKER) {
      return;
    }
    this.isBetweenCondition = filter.condition === FilterConditionEnum.DATE_BETWEEN_KEY;
    this.datePickerFilterForm.patchValue({
      date: this.isBetweenCondition ? null : DateTime.fromISO(filter.value[0]),
      lowerDate: this.isBetweenCondition ? DateTime.fromISO(filter.value[0]) : null,
      upperDate: this.isBetweenCondition ? DateTime.fromISO(filter.value[1]) : null,
    }, { emitEvent: false });
    this.setLabels(filter);
  }

  @Output()
  public dateChange = new EventEmitter<DateTime>();

  @Output()
  public betweenDatesChange = new EventEmitter<{ lower: DateTime; upper: DateTime }>();

  public datePickerFilterForm = new FormGroup({
    date: new FormControl<DateTime | null>(null),
    lowerDate: new FormControl<DateTime | null>(null),
    upperDate: new FormControl<DateTime | null>(null),
  });

  public ngOnInit(): void {
    this.datePickerFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        if (value.lowerDate && value.upperDate) {
          this.betweenDatesChange.emit({
            lower: value.lowerDate,
            upper: value.upperDate,
          });
        } else if (value.date) {
          this.dateChange.emit(value.date);
        }
      });
  }

  private setLabels(filter: AttributeFilterModel) {
    const conditionType = AttributeFilterHelper.getConditionTypes()
      .find(type => type.condition === filter.condition);
    const conditionLabel = filter.invertCondition ? conditionType?.inverseReadableLabel : conditionType?.readableLabel;
    this.label = $localize `:@@core.filter.date-filter.label:Filter: ${filter.attribute} ${conditionLabel} - value`;
    if (this.isBetweenCondition) {
      this.labelFromValue = $localize `:@@core.filter.date-filter.label-from-value:Filter: ${filter.attribute} ${conditionLabel} - from value`;
      this.labelUntilValue = $localize `:@@core.filter.date-filter.label-until-value:Filter: ${filter.attribute} ${conditionLabel} - until value`;
    }
  }

}
