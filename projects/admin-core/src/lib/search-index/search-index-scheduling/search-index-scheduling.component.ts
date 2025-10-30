import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, Input, inject, LOCALE_ID } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SearchIndexModel, TaskSchedule } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { DateAdapter } from '@angular/material/core';

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
  public HOURLY_CRON_EXPRESSION = '0 0 0/1 1/1 * ? *';

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
    { cronExpression: this.HOURLY_CRON_EXPRESSION, viewValue: $localize `:@@admin-core.search-index.schedule.every-hour:Every hour` },
    { cronExpression: '1/1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-day:Every day` },
    { cronExpression: '? * MON *', viewValue: $localize `:@@admin-core.search-index.schedule.every-week:Every week on monday` },
    { cronExpression: '1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-month:Every first day of the month` },
  ];

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
        if (value.partialCronExpression) {
          const timePart = value.time ? this.timeToPartialCronExpression(value.time) : '0 0 18 ';
          const cronExpression = value.partialCronExpression === this.HOURLY_CRON_EXPRESSION
            ? value.partialCronExpression
            : timePart + value.partialCronExpression;
          schedule = {
            ...this.taskSchedule,
            cronExpression: cronExpression,
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
      const { time, partialCronExpression } = this.splitCronExpression(schedule.cronExpression);
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
    const minutes = isNaN(time.getMinutes()) ? 0 : time.getMinutes();
    const hours = isNaN(time.getHours()) ? 6 : time.getHours();
    return `0 ${minutes} ${hours} `;
  }

  private splitCronExpression(cronExpression: string): { time: Date | null; partialCronExpression: string } {
    const parts = cronExpression.split(' ');
    if (cronExpression === this.HOURLY_CRON_EXPRESSION) {
      return { time: null, partialCronExpression: cronExpression };
    }
    const hours = parseInt(parts[2], 10);
    const minutes = parseInt(parts[1], 10);
    const time = new Date();
    time.setHours(hours, minutes, 0);
    const partialCronExpression = parts.slice(3).join(' ');
    return { time, partialCronExpression };
  }

}
