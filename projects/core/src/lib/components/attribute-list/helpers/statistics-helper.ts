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

  public static getStatisticsHelpMessage() {
    return $localize `:@@core.attribute-list.statistics-help:Statistics are calculated from the active filters. Use the filter button in column headers to add or remove filters.`;
  }

  public static getStatisticOptions() {
    return statisticOptions;
  }

  public static getLabelForStatisticType(stat: AttributeListStatisticColumnModel) {
    const statType = statisticOptionsMap.get(stat.type);
    const statValueLabel = StatisticsHelper.getStatisticValue(stat);
    if (statValueLabel) {
      return `${statType} = ${statValueLabel}`;
    }
    return "";
  }

  public static isStatisticTypeAvailable(type: StatisticType, dataType: AttributeType) {
    if (!statisticNumberTypes.has(type)) {
      // non-number types are always available
      return true;
    }
    const isNumberDataType = dataType === AttributeType.INTEGER || dataType === AttributeType.DOUBLE || dataType === AttributeType.NUMBER;
    return statisticNumberTypes.has(type) && isNumberDataType;
  }

  private static getStatisticValue(stat: AttributeListStatisticColumnModel): string | null {
    const columnDataType = stat.dataType;
    if (typeof stat.value !== 'number' || stat.type === StatisticType.NONE) {
      return null;
    }
    if (stat.type === StatisticType.COUNT || (columnDataType && columnDataType.toLowerCase() === 'integer')) {
      return stat.value.toFixed();
    }
    return stat.value.toFixed(2);
  }

}
