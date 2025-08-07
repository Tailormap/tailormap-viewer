import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
import { DateTime } from 'luxon';
import { DatePickerFilterModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

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

  @Input()
  public set datePickerFilterConfiguration(config: DatePickerFilterModel) {
    this.isBetweenCondition = !config.initialDate;
    this.datePickerFilterForm.patchValue({
      date: config.initialDate ? DateTime.fromISO(config.initialDate) : null,
      lowerDate: config.initialLowerDate ? DateTime.fromISO(config.initialLowerDate) : null,
      upperDate: config.initialUpperDate ? DateTime.fromISO(config.initialUpperDate) : null,
    }, { emitEvent: false });
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

}
