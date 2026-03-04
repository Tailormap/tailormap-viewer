import { FilterState } from '../../state';
import {
  BookmarkAttributeFilterModel, BookmarkSpatialFilterModel,
} from './application-bookmark-fragments';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum, SpatialFilterModel } from '@tailormap-viewer/api';
import equal from 'fast-deep-equal';
import { FilterTypeHelper } from '../../filter';

export class FilterBookmarkHelper {
  private static readonly COMPACT = false;

  public static fragmentFromFilterState(filterState: FilterState): any /*CompactFilterBookmarkFragment*/ {
    console.log('Create bookmark from filter state:', filterState);

    const bookmarkData: any = {};

    const currentPresetFilters = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.source === 'PRESET');
    if (currentPresetFilters.length > 0) {

      for(const currentPresetFilter of currentPresetFilters) {
        const configuredPresetFilter = filterState.configuredFilterGroups.find(fg => fg.id === currentPresetFilter.id && fg.source === 'PRESET');
        if (!configuredPresetFilter) {
          continue;
        }
        if (equal(currentPresetFilter, configuredPresetFilter)) {
          continue;
        }
        const bookmarkFilter: any = { id: currentPresetFilter.id };
        if (currentPresetFilter.disabled !== configuredPresetFilter.disabled) {
          bookmarkFilter.d = currentPresetFilter.disabled;
        }
        let bookmarkFilters = undefined;
        for (const filter of currentPresetFilter.filters) {
          const configuredFilter = configuredPresetFilter.filters.find(f => f.id === filter.id);
          if (!configuredFilter) {
            continue;
          }
          if (equal(filter, configuredFilter)) {
            continue;
          }
          const bf: any = { id: filter.id };
          if (filter.disabled !== configuredFilter.disabled) {
            bf.d = filter.disabled;
          }
          if (FilterTypeHelper.isAttributeFilter(filter) && !equal(filter.value, configuredFilter.value)) {
            bf.v = filter.value;
          } else {
            continue;
          }
          if (!bookmarkFilters) {
            bookmarkFilters = [];
          }
          bookmarkFilters.push(bf);
        }
        if (bookmarkFilters) {
          bookmarkFilter.f = bookmarkFilters;
        }

        if (!bookmarkData.p) {
          bookmarkData.p = [];
        }
        bookmarkData.p.push(bookmarkFilter);
      }

    }

    // Create a condensed object with the same information as the filter state, with shorter property names and only the necessary
    // information, to keep the bookmark fragment as small as possible. The filter state can contain a lot of information that is
    // not needed for the bookmark, such as the source of the filter group, or the type of the filter. The bookmark only needs to
    // know the layer ids, the disabled state, and the filters with their conditions and values.

    const attributeFilters = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.source === 'ATTRIBUTE_LIST' && filterGroup.type === FilterTypeEnum.ATTRIBUTE);

    for (const fg of attributeFilters) {
      const bfg = FilterBookmarkHelper.COMPACT ?  {
          d: fg.disabled,
          pg: fg.parentGroup,
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
        } : (fg as FilterGroupModel<AttributeFilterModel>);
      if (!bookmarkData.a) {
        bookmarkData.a = [];
      }
      bookmarkData.a.push(bfg);
    }

    const spatialFilters = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.type === FilterTypeEnum.SPATIAL);
    for (const fg of spatialFilters) {
      const bfg = FilterBookmarkHelper.COMPACT ? {
        id: fg.id,
        l: fg.layerIds,
        d: fg.disabled,
        pg: fg.parentGroup,
        f: (fg.filters as SpatialFilterModel[]).map(f => ({
          id: f.id, // changed to size 6 instead of default 21, could be regenerated?
          d: f.disabled,
          gC: f.geometryColumns.map(gc => ({ l: gc.layerId, c: gc.column })),
          g: f.geometries.map(g => ({ id: g.id, g: g.geometry, l: g.referenceLayerId })),
          l: f.baseLayerId,
          b: f.buffer,
        })),
      } : (fg as FilterGroupModel<SpatialFilterModel>);
      if (!bookmarkData.s) {
        bookmarkData.s = [];
      }
      bookmarkData.s.push(bfg);
    }

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
      parentGroup: bfg.pg,
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

  public static presetFilterGroupFromBookmark(filterState: FilterState, bfg: any/*BookmarkFilterGroup<BookmarkAttributeFilterModel>*/) {
    if (this.COMPACT) {
      throw new Error('Not implemented');
    }
    const configuredPresetFilter = filterState.configuredFilterGroups.find(fg => fg.id === bfg.id && fg.source === 'PRESET');
    if (!configuredPresetFilter) {
      console.log(`Bookmark: Preset filter group with id ${bfg.id} not found in configured filter groups`);
      return undefined;
    }
    const filters = configuredPresetFilter.filters.map(f => {
      const bf = bfg.f.find((tbf: any) => tbf.id === f.id);
      if (bf) {
        return {
          ...f,
          value: bf.v,
          disabled: bf.d,
        };
      } else {
        return f;
      }
    });
    return {
      ...configuredPresetFilter,
      disabled: bfg.d,
      filters,
    } as FilterGroupModel<AttributeFilterModel>;
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
      parentGroup: bfg.pg,
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
