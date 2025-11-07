import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, Input, inject, LOCALE_ID } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SearchIndexModel, TaskSchedule } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { DateAdapter } from '@angular/material/core';
import { CronExpressionHelper } from '../../tasks/helpers/cron-expression.helper';

@Component({
  selector: 'tm-admin-search-index-scheduling',
  templateUrl: './search-index-scheduling.component.html',
  styleUrls: ['./search-index-scheduling.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchIndexSchedulingComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private locale = inject(LOCALE_ID);


  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
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

  public hourlyCronExpression = CronExpressionHelper.HOURLY_CRON_EXPRESSION;
  public scheduleOptions = CronExpressionHelper.SCHEDULE_OPTIONS;

  public scheduleForm = new FormGroup({
    partialCronExpression: new FormControl('', { nonNullable: true }),
    time: new FormControl<Date | null>(null, { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<number | undefined>(undefined, { nonNullable: true }),
  });

  public ngOnInit(): void {
    this._adapter.setLocale(this.locale);
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
        if (value.partialCronExpression || this.taskSchedule) {
          const timePart = value.time ? this.timeToPartialCronExpression(value.time) : '0 0 6 ';
          const cronExpression = value.partialCronExpression === CronExpressionHelper.HOURLY_CRON_EXPRESSION
            ? value.partialCronExpression
            : timePart + value.partialCronExpression;
          schedule = {
            ...this.taskSchedule,
            cronExpression: cronExpression || '',
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
      const time = new Date();
      time.setHours(6, 0, 0);
      this.scheduleForm.patchValue({
        partialCronExpression: '',
        time: time,
        description: preFillDescription,
        priority: undefined,
      }, { emitEvent: false });
    } else {
      const { time, partialCronExpression } = CronExpressionHelper.splitCronExpression(schedule.cronExpression);
      if (!this.scheduleOptions.some(option => option.cronExpression === partialCronExpression)) {
        this.scheduleOptions.push({ cronExpression: schedule.cronExpression, viewValue: schedule.cronExpression });
      }
      this.scheduleForm.patchValue({
        partialCronExpression: partialCronExpression,
        time: time,
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

  private timeToPartialCronExpression(time: Date): string {
    const timeDateObject = new Date(time);
    const minutes = isNaN(timeDateObject.getMinutes()) ? 0 : timeDateObject.getMinutes();
    const hours = isNaN(timeDateObject.getHours()) ? 6 : timeDateObject.getHours();
    return `0 ${minutes} ${hours} `;
  }

}
