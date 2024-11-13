import { TaskModel } from './task.model';

export interface TaskDetailsModel extends TaskModel {
  /** A valid (Quartz) cron expression. */
  cronExpression: string;

  timezone?: string;
  startTime?: Date;
  lastTime?: Date;
  status?: string;
  progress?: string;
  lastResult?: string;
  nextFireTimes?: Date[];
  jobData?: Record<string, string>;
}
