import { AttributeListStatisticColumnModel } from '../models/attribute-list-statistic-column.model';
import { StatisticType } from '../models/attribute-list-api-service.model';
import { AttributeType } from '@tailormap-viewer/api';

const statisticOptions = [
  { type: StatisticType.SUM, label: $localize `:@@core.attribute-list.statistics-sum:Sum` },
  { type: StatisticType.MIN, label: $localize `:@@core.attribute-list.statistics-min:Min` },
  { type: StatisticType.MAX, label: $localize `:@@core.attribute-list.statistics-max:Max` },
  { type: StatisticType.AVERAGE, label: $localize `:@@core.attribute-list.statistics-avg:Average` },
  { type: StatisticType.COUNT, label: $localize `:@@core.attribute-list.statistics-count:Count` },
  { type: StatisticType.NONE, label: $localize `:@@core.attribute-list.statistics-none:None` },
];

const statisticOptionsMap: Map<StatisticType, string> = new Map(statisticOptions.map(opt => [ opt.type, opt.label ]));

const statisticNumberTypes = new Set([
  StatisticType.SUM,
  StatisticType.MIN,
  StatisticType.MAX,
  StatisticType.AVERAGE,
]);

export class StatisticsHelper {

  public static getStatisticOptions() {
    return statisticOptions;
  }

  public static getLabelForStatisticType(type: StatisticType) {
    return statisticOptionsMap.get(type);
  }

  public static isStatisticTypeAvailable(type: StatisticType, dataType: AttributeType) {
    if (!statisticNumberTypes.has(type)) {
      // non-number types are always available
      return true;
    }
    const isNumberDataType = dataType === AttributeType.INTEGER || dataType === AttributeType.DOUBLE || dataType === AttributeType.NUMBER;
    return statisticNumberTypes.has(type) && isNumberDataType;
  }

  public static getStatisticValue(columnDataType?: string, column?: AttributeListStatisticColumnModel): string | null {
    if (!column || !column.value || column.type === StatisticType.NONE) {
      return null;
    }
    if (column.type === StatisticType.COUNT || (columnDataType && columnDataType.toLowerCase() === 'integer')) {
      return column.value.toFixed();
    }
    return column.value.toFixed(2);
  }

  public static getStatisticsHelpMessage() {
    return $localize `:@@core.attribute-list.statistics-help:Statistics are calculated from the active filters. Use the filter button in column headers to add or remove filters.`;
  }
}
