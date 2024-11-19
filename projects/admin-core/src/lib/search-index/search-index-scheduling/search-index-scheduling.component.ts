import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SearchIndexModel, TaskSchedule } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'tm-admin-search-index-scheduling',
  templateUrl: './search-index-scheduling.component.html',
  styleUrls: ['./search-index-scheduling.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexSchedulingComponent implements OnInit {

  public taskSchedule: TaskSchedule | undefined = undefined;

  @Input({ required: true })
  public set searchIndex(form: SearchIndexModel | null) {
    this.taskSchedule = form?.schedule;
    this.initForm(form?.schedule);
  }

  @Output()
  public updateSchedule = new EventEmitter<{ searchIndex: Pick<SearchIndexModel, 'schedule'> }>();

  @Output()
  public formChanged = new EventEmitter<boolean>();

  public scheduleOptions = [
    { cronExpression: '', viewValue: 'No schedule' },
    { cronExpression: '0 0 0/1 1/1 * ? *', viewValue: 'Every hour' },
    { cronExpression: '0 0 18 1/1 * ? *', viewValue: 'Every day at 18:00' },
    { cronExpression: '0 0 18 * * 1 *', viewValue: 'Every week monday at 18:00' },
    { cronExpression: '0 0 18 1 * ? *', viewValue: 'Every first day of the month at 18:00' },
  ];

  constructor(
    private destroyRef: DestroyRef,
  ) { }

  public scheduleForm = new FormGroup({
    cronExpression: new FormControl(),
    description: new FormControl(),
    priority: new FormControl<number | undefined>(undefined, { nonNullable: true }),
  });

  public ngOnInit(): void {
    this.scheduleForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(validFormChanged => {
        this.formChanged.emit(validFormChanged);
      });
    this.scheduleForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        let schedule: TaskSchedule | undefined = undefined;
        if (value.cronExpression) {
          schedule = {
            ...this.taskSchedule,
            cronExpression: value.cronExpression,
            description: value.description,
            priority: value.priority,
          };
        }
        const searchIndex: Pick<SearchIndexModel, 'schedule'> = {
          schedule: schedule,
        };
        this.updateSchedule.emit({ searchIndex });
      });
  }

  private initForm(schedule: TaskSchedule | undefined) {
    if (!schedule) {
      this.scheduleForm.patchValue({ cronExpression: '', description: '', priority: undefined }, { emitEvent: false });
      this.scheduleForm.controls['description'].disable();
      this.scheduleForm.controls['priority'].disable();
    } else {
      this.scheduleForm.patchValue({
        cronExpression: schedule.cronExpression,
        description: schedule.description,
        priority: schedule.priority,
      }, { emitEvent: false });
      this.scheduleForm.controls['description'].enable();
      this.scheduleForm.controls['priority'].enable();
    }
  }

  private isValidForm(): boolean {
    const values = this.scheduleForm.getRawValue();
    return FormHelper.isValidValue(values.description)
      && FormHelper.isValidPositiveIntegerValue(values.priority)
      && this.scheduleForm.dirty
      && this.scheduleForm.valid;
  }

  public onSelectionChanged(change: MatSelectChange) {
    if (change.value) {
      this.scheduleForm.controls['description'].enable();
      this.scheduleForm.controls['priority'].enable();
    } else {
      this.scheduleForm.controls['description'].disable();
      this.scheduleForm.controls['priority'].disable();
    }
  }

}
