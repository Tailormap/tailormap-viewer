export interface TaskSchedule {
  /** The unique identifier of the task schedule. read-only. */
  uuid: string | null;
  /** A valid (Quartz) cron expression. */
  cronExpression: string;
  /** Optional description of the scheduled task. */
  description?: string;
  /** Optional priority value for the scheduled task. Greater than 0, default 5*/
  priority?: number;
}
