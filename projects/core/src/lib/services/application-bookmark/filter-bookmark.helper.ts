import { FilterState } from '../../state';
import {
  BookmarkAttributeFilterModel, BookmarkSpatialFilterModel,
} from './application-bookmark-fragments';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum, SpatialFilterModel } from '@tailormap-viewer/api';

export class FilterBookmarkHelper {
  private static readonly COMPACT = false;

  public static fragmentFromFilterState(filterState: FilterState): any /*CompactFilterBookmarkFragment*/ {
    console.log('Create bookmark from filter state:', filterState);

    const bookmarkData: any = {};

    // Create a condensed object with the same information as the filter state, with shorter property names and only the necessary
    // information, to keep the bookmark fragment as small as possible. The filter state can contain a lot of information that is
    // not needed for the bookmark, such as the source of the filter group, or the type of the filter. The bookmark only needs to
    // know the layer ids, the disabled state, and the filters with their conditions and values.

    bookmarkData.al = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.source === 'ATTRIBUTE_LIST' && filterGroup.type === FilterTypeEnum.ATTRIBUTE)
      .map(fg => {
        if (FilterBookmarkHelper.COMPACT) {
          return {
            d: fg.disabled,
            f: (fg.filters as AttributeFilterModel[]).map(f => ({
              id: f.id, // changed to size 6 instead of default 21, could be regenerated?
              d: f.disabled,
              a: f.attribute,
              aT: f.attributeType,
              c: f.condition,
              iC: f.invertCondition,
              cS: f.caseSensitive,
              v: f.value,
              aA: f.attributeAlias,
            })),
          };
        } else {
          return fg as FilterGroupModel<AttributeFilterModel>;
        }
      });

    bookmarkData.s = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.type === FilterTypeEnum.SPATIAL)
      .map(fg => {
        if (FilterBookmarkHelper.COMPACT) {
          return {
            id: fg.id,
            l: fg.layerIds,
            d: fg.disabled,
            f: (fg.filters as SpatialFilterModel[]).map(f => ({
              id: f.id, // changed to size 6 instead of default 21, could be regenerated?
              d: f.disabled,
              gC: f.geometryColumns.map(gc => ({ l: gc.layerId, c: gc.column })),
              g: f.geometries.map(g => ({ id: g.id, g: g.geometry, l: g.referenceLayerId })),
              l: f.baseLayerId,
              b: f.buffer,
            })),
          };
        } else {
          return fg as FilterGroupModel<SpatialFilterModel>;
        }
      });

    return bookmarkData;
  }

  public static attributeFilterGroupFromBookmark(bfg: any/*BookmarkFilterGroup<BookmarkAttributeFilterModel>*/): FilterGroupModel<AttributeFilterModel> {
    if (!this.COMPACT) {
      return bfg as FilterGroupModel<AttributeFilterModel>;
    }
    return {
      id: bfg.id,
      source: 'ATTRIBUTE_LIST',
      layerIds: bfg.l,
      type: FilterTypeEnum.ATTRIBUTE,
      disabled: bfg.d,
      operator: 'AND', // 'OR' is never set currently, so it is left out and restored here with a fixed value
      filters: bfg.f.map((f: BookmarkAttributeFilterModel) => ({
        id: f.id,
        type: FilterTypeEnum.ATTRIBUTE,
        disabled: f.d,
        attribute: f.a,
        attributeType: f.aT,
        condition: f.c,
        invertCondition: f.iC,
        caseSensitive: f.cS,
        value: f.v,
        attributeAlias: f.aA,
      })),
    };
  }

  public static spatialFilterGroupFromBookmark(bfg: any /*BookmarkFilterGroup<BookmarkSpatialFilterModel>*/): FilterGroupModel<SpatialFilterModel> {
    if (!this.COMPACT) {
      return bfg as FilterGroupModel<SpatialFilterModel>;
    }
    return {
      id: bfg.id,
      source: 'SPATIAL_FILTER_FORM',
      layerIds: bfg.l,
      type: FilterTypeEnum.SPATIAL,
      disabled: bfg.d,
      operator: 'AND', // 'OR' is never set currently, so it is left out and restored here with a fixed value
      filters: bfg.f.map((f: BookmarkSpatialFilterModel) => ({
        id: f.id,
        type: FilterTypeEnum.SPATIAL,
        disabled: f.d,
        geometries: f.g.map(g => ({ id: g.id, geometry: g.g, referenceLayerId: g.l })),
        geometryColumns: f.gC.map(gc => ({ layerId: gc.l, column: gc.c })),
        baseLayerId: f.l,
        buffer: f.b,
      })),
    };
  }
}
