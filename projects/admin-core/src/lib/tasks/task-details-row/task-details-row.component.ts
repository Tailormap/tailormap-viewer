import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-admin-task-details-row',
  templateUrl: './task-details-row.component.html',
  styleUrls: ['./task-details-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsRowComponent implements OnInit {

  @Input()
  public infoType: string = '';

  @Input()
  public infoValue: string | undefined | null = '';

  private jobDataNiceTitles: Record<string, string> = {
    lastExecutionFinished: 'Last time task was finished',
    lastResult: 'Last result',
  };

  constructor() { }

  public ngOnInit(): void {
  }

  public niceTitle(original: string): string {
    return this.jobDataNiceTitles[original] ?? original;
  }

  public canConvertToDate(original: string): boolean {
    return !isNaN(Date.parse(original)) && isNaN(Number(original));
  }

}
