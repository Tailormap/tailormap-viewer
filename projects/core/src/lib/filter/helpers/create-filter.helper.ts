import { FilterGroupModel } from '@tailormap-viewer/api';
import { Cql2JsonFilterHelper } from './cql2-json-filter.helper';
import { CqlFilterHelper } from './cql-filter.helper';
import { Cql2JsonFilter } from '../models/cql2-json-filter.model';

/**
 * Filter format types supported by CreateFilterHelper
 */
export type FilterFormat = 'CQL' | 'CQL2JSON';

/**
 * Type mapping for filter formats to their output types
 */
export type FilterFormatOutput<T extends FilterFormat> =
  T extends 'CQL' ? string :
  T extends 'CQL2JSON' ? Cql2JsonFilter :
  never;

/**
 * Helper class to create filters in various formats
 */
export class CreateFilterHelper {

  /**
   * Get filters in CQL format
   */
  public static getFilters(
    filterGroups: FilterGroupModel[],
    type: 'CQL',
  ): Map<string, string>;

  /**
   * Get filters in CQL2 JSON format
   */
  public static getFilters(
    filterGroups: FilterGroupModel[],
    type: 'CQL2JSON',
  ): Map<string, Cql2JsonFilter>;

  /**
   * Get filters in the specified format
   */
  public static getFilters<T extends FilterFormat>(
    filterGroups: FilterGroupModel[],
    type: T,
  ): Map<string, FilterFormatOutput<T>>;

  public static getFilters(
    filterGroups: FilterGroupModel[],
    type: FilterFormat,
  ): Map<string, string | Cql2JsonFilter> {
    // Extract unique layer IDs from all filter groups
    const layerIdList = filterGroups.reduce<string[]>((ids, f) => {
      return [ ...ids, ...f.layerIds ];
    }, []);
    const layerIds = new Set<string>(layerIdList);

    // Create filters for each layer
    const filterDict = new Map<string, string | Cql2JsonFilter>();
    layerIds.forEach(layerId => {
      const filtersForLayer = filterGroups.filter(f => f.layerIds.includes(layerId));
      const filter = this.getFilterForLayer(filtersForLayer, layerId, type);
      if (filter) {
        filterDict.set(layerId, filter);
      }
    });

    return filterDict;
  }

  /**
   * Get filter for a specific layer in the requested format
   */
  private static getFilterForLayer(
    filterGroups: FilterGroupModel[],
    layerId: string,
    type: FilterFormat,
  ): string | Cql2JsonFilter | null {
    if (type === 'CQL') {
      return CqlFilterHelper.getFilterForLayer(filterGroups, layerId);
    }
    if (type === 'CQL2JSON') {
      return Cql2JsonFilterHelper.getFilterForLayer(filterGroups, layerId);
    }
    throw new Error(`Unsupported filter format: ${type}`);
  }

}
