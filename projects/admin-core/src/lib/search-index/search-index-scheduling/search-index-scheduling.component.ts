import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, DestroyRef, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SearchIndexModel, TaskSchedule } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

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
    {cronExpression: '', viewValue: 'No schedule'},
    {cronExpression: '0 0 0/1 1/1 * ? *', viewValue: 'Every hour'},
    {cronExpression: '0 0 18 1/1 * ? *', viewValue: 'Every day at 18:00'},
    {cronExpression: '0 0 18 * * 1 *', viewValue: 'Every week monday at 18:00'},
    {cronExpression: '0 0 18 1 * ? *', viewValue: 'Every first day of the month at 18:00'},
  ];

  constructor(
    private destroyRef: DestroyRef,
  ) { }

  public scheduleForm = new FormGroup({
    cronExpression: new FormControl(),
    description: new FormControl(),
    priority: new FormControl(),
  });

  public ngOnInit(): void {
    this.scheduleForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged(),
      )
      .subscribe(validForm => {
        this.formChanged.emit(true);
      });
    this.scheduleForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        const schedule: TaskSchedule = {
          ...this.taskSchedule,
          cronExpression: value.cronExpression,
          description: value.description,
          priority: value.priority,
        };
        const searchIndex: Pick<SearchIndexModel, 'schedule'> = {
          schedule: schedule,
        };
        this.updateSchedule.emit({ searchIndex });
      });
  }

  private initForm(schedule: TaskSchedule | undefined) {
    if (!schedule) {
      this.scheduleForm.patchValue({ cronExpression: '', description: '', priority: '' }, { emitEvent: false });
    } else {
      this.scheduleForm.patchValue({
        cronExpression: schedule.cronExpression,
        description: schedule.description,
        priority: schedule.priority,
      }, { emitEvent: false });
    }
  }

}
