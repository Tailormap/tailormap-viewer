import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SearchIndexModel, TaskSchedule } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';

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
    this.initForm(form?.schedule, form?.name);
  }

  @Output()
  public updateSchedule = new EventEmitter<{ searchIndex: Pick<SearchIndexModel, 'schedule'> }>();

  @Output()
  public formChanged = new EventEmitter<boolean>();

  public scheduleOptions = [
    { cronExpression: '', viewValue: $localize `:@@admin-core.search-index.schedule.no-schedule:No schedule` },
    { cronExpression: '0 0 0/1 1/1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-hour:Every hour` },
    { cronExpression: '0 0 18 1/1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-day:Every day at 18:00` },
    { cronExpression: '0 0 18 ? * MON *', viewValue: $localize `:@@admin-core.search-index.schedule.every-week:Every week Monday at 18:00` },
    { cronExpression: '0 0 18 1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-month:Every first day of the month at 18:00` },
  ];

  constructor(
    private destroyRef: DestroyRef,
  ) { }

  public scheduleForm = new FormGroup({
    cronExpression: new FormControl('', { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<number | undefined>(undefined, { nonNullable: true }),
  });

  public ngOnInit(): void {
    const scheduleFormChanges$ = this.scheduleForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(250),
    );
    scheduleFormChanges$
      .pipe(
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(validFormChanged => {
        this.formChanged.emit(validFormChanged);
      });
    scheduleFormChanges$
      .pipe(
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

  private initForm(schedule: TaskSchedule | undefined, searchIndexName?: string) {
    const preFillDescription: string = $localize `:@@admin-core.search-index.schedule.prefill-description:Update ${searchIndexName}`;
    if (!schedule) {
      this.scheduleForm.patchValue({ cronExpression: '', description: preFillDescription, priority: undefined }, { emitEvent: false });
    } else {
      if (!this.scheduleOptions.some(option => option.cronExpression === schedule.cronExpression)) {
        this.scheduleOptions.push({ cronExpression: schedule.cronExpression, viewValue: schedule.cronExpression });
      }
      this.scheduleForm.patchValue({
        cronExpression: schedule.cronExpression,
        description: schedule.description || preFillDescription,
        priority: schedule.priority,
      }, { emitEvent: false });
    }
  }

  private isValidForm(): boolean {
    const values = this.scheduleForm.getRawValue();
    return ( FormHelper.isValidPositiveIntegerValue(values.priority) || values.priority === null || values.priority === undefined )
      && this.scheduleForm.dirty
      && this.scheduleForm.valid;
  }

}
