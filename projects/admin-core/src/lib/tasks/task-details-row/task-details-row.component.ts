import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-admin-task-details-row',
  templateUrl: './task-details-row.component.html',
  styleUrls: ['./task-details-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsRowComponent {

  @Input()
  public infoType: string = '';

  @Input()
  public infoValue: string | undefined | null = '';

  private jobDataNiceTitles: Record<string, string> = {
    lastExecutionFinished: $localize `:@@admin-core.tasks.task-details.last-time-task-was-started:Last time task was finished`,
    lastResult: $localize `:@@admin-core.tasks.task-details.last-result:Last result`,
    type: $localize `:@@admin-core.tasks.task-details.type:Type`,
    description: $localize `:@@admin-core.tasks.task-details.description:Description`,
    uuid: $localize `:@@admin-core.tasks.task-details.uuid:Uuid`,
    cronExpression: $localize `:@@admin-core.tasks.task-details.cron-expression:Cron expression`,
    timezone: $localize `:@@admin-core.tasks.task-details.timezone:Timezone`,
    startTime: $localize `:@@admin-core.tasks.task-details.start-time:Start time`,
    lastTime: $localize `:@@admin-core.tasks.task-details.last-time:Last time the task was started`,
    state: $localize `:@@admin-core.tasks.task-details.state:State`,
    scheduling_state: $localize `:@@admin-core.tasks.task-details.scheduling-state:Scheduling state`,
    progress: $localize `:@@admin-core.tasks.task-details.progress:Progress`,
    executions: $localize `:@@admin-core.tasks.task-details.executions:Executions`,
    priority: $localize `:@@admin-core.tasks.task-details.priority:Priority`,
  };

  constructor() { }

  public niceTitle(original: string): string {
    return this.jobDataNiceTitles[original] ?? original;
  }

  public canConvertToDate(original: string): boolean {
    return !isNaN(Date.parse(original)) && isNaN(Number(original));
  }

}
