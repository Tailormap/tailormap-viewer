

export class CronExpressionHelper {
  public static HOURLY_CRON_EXPRESSION = '0 0 0/1 1/1 * ? *';

  public static SCHEDULE_OPTIONS = [
    { cronExpression: '', viewValue: $localize `:@@admin-core.search-index.schedule.no-schedule:No schedule` },
    { cronExpression: CronExpressionHelper.HOURLY_CRON_EXPRESSION, viewValue: $localize `:@@admin-core.search-index.schedule.every-hour:Every hour` },
    { cronExpression: '1/1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-day:Every day` },
    { cronExpression: '? * MON *', viewValue: $localize `:@@admin-core.search-index.schedule.every-week:Every week on monday` },
    { cronExpression: '1 * ? *', viewValue: $localize `:@@admin-core.search-index.schedule.every-month:Every first day of the month` },
  ];

  public static splitCronExpression(cronExpression: string): { time: Date | null; partialCronExpression: string } {
    const parts = cronExpression.split(' ');
    if (cronExpression === CronExpressionHelper.HOURLY_CRON_EXPRESSION) {
      return { time: null, partialCronExpression: cronExpression };
    }
    const hours = parseInt(parts[2], 10);
    const minutes = parseInt(parts[1], 10);
    const time = new Date();
    time.setHours(hours, minutes, 0);
    const partialCronExpression = parts.slice(3).join(' ');
    return { time, partialCronExpression };
  }

  public static cronExpressionToReadableText(cronExpression: string, locale: string): string {
    if (cronExpression === CronExpressionHelper.HOURLY_CRON_EXPRESSION) {
      return CronExpressionHelper.SCHEDULE_OPTIONS
        .find(option => option.cronExpression === CronExpressionHelper.HOURLY_CRON_EXPRESSION)?.viewValue || cronExpression;
    }
    const { time, partialCronExpression } = CronExpressionHelper.splitCronExpression(cronExpression);
    const timeString = time
      ? time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : '';
    const schedule = CronExpressionHelper.SCHEDULE_OPTIONS
      .find(option => option.cronExpression === partialCronExpression);
    if (schedule) {
      return timeString ? $localize `:@@admin-core.tasks.time:${schedule.viewValue} at ${timeString}` : schedule.viewValue;
    }
    return cronExpression;
  }

}
