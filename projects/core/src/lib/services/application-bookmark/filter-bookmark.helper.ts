import { FilterState } from '../../state';
import {
  BookmarkAttributeFilterModel, BookmarkFilterGroup, BookmarkPresetFilterModel, BookmarkSpatialFilterModel, CompactFilterBookmarkFragment,
} from './application-bookmark-fragments';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum, SpatialFilterModel } from '@tailormap-viewer/api';
import equal from 'fast-deep-equal';
import { FilterTypeHelper } from '../../filter';

export class FilterBookmarkHelper {
  public static fragmentFromFilterState(filterState: FilterState): CompactFilterBookmarkFragment {
    console.log('Create bookmark from filter state:', filterState);

    const bookmarkData: CompactFilterBookmarkFragment = {};
    FilterBookmarkHelper.addPresetFilterGroupsToBookmark(bookmarkData, filterState);
    FilterBookmarkHelper.addAttributeFilterGroupsToBookmark(bookmarkData, filterState);
    FilterBookmarkHelper.addSpatialFilterGroupsToBookmark(bookmarkData, filterState);
    return bookmarkData;
  }

  private static addAttributeFilterGroupsToBookmark(bookmarkData: CompactFilterBookmarkFragment, filterState: FilterState) {
    // Create a condensed object with the same information as the filter state, with shorter property names and only the necessary
    // information, to keep the bookmark fragment as small as possible. The filter state can contain a lot of information that is
    // not needed for the bookmark, such as the source of the filter group, or the type of the filter. The bookmark only needs to
    // know the layer ids, the disabled state, and the filters with their conditions and values.

    const attributeFilters = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.source === 'ATTRIBUTE_LIST' && filterGroup.type === FilterTypeEnum.ATTRIBUTE);

    for (const fg of attributeFilters) {
      const bfg: any = {
        id: fg.id,
        l: fg.layerIds,
      };
      if (fg.disabled) { bfg.d = fg.disabled; }
      if (fg.parentGroup) { bfg.pg = fg.parentGroup; }
      bfg.f = (fg.filters as AttributeFilterModel[]).map(f => {
        const bf: any = {
          id: f.id, // changed to size 6 instead of default 21, could be regenerated?
          a: f.attribute,
          aT: f.attributeType,
          c: f.condition,
          v: f.value,
          aA: f.attributeAlias,
        };
        if (f.disabled) { bf.d = f.disabled; }
        if (f.invertCondition) { bf.iC = f.invertCondition; }
        if (f.caseSensitive) { bf.cS = f.caseSensitive; }
        return bf;
      });

      if (!bookmarkData.a) {
        bookmarkData.a = [];
      }
      bookmarkData.a.push(bfg);
    }
  }

  public static attributeFilterGroupFromBookmark(bfg: BookmarkFilterGroup<BookmarkAttributeFilterModel>): FilterGroupModel<AttributeFilterModel> {
    return {
      id: bfg.id,
      source: 'ATTRIBUTE_LIST',
      layerIds: bfg.l,
      type: FilterTypeEnum.ATTRIBUTE,
      disabled: bfg.d,
      parentGroup: bfg.pG,
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

  private static addPresetFilterGroupsToBookmark(bookmarkData: CompactFilterBookmarkFragment, filterState: FilterState) {
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
  }

  public static presetFilterGroupFromBookmark(filterState: FilterState, bfg:BookmarkFilterGroup<BookmarkPresetFilterModel>) {
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

  private static addSpatialFilterGroupsToBookmark(bookmarkData: CompactFilterBookmarkFragment, filterState: FilterState) {
    const spatialFilters = filterState.currentFilterGroups
      .filter(filterGroup => filterGroup.type === FilterTypeEnum.SPATIAL);
    for (const fg of spatialFilters) {
      const bfg: any = {
        id: fg.id,
        l: fg.layerIds,
      };
      if (fg.disabled) { bfg.d = fg.disabled; }
      if (fg.parentGroup) { bfg.pg = fg.parentGroup; }
      bfg.f = (fg.filters as SpatialFilterModel[]).map(f => {
        const bf: any = {
          id: f.id, // changed to size 6 instead of default 21, could be regenerated?
          gC: f.geometryColumns.map(gc => ({ l: gc.layerId, c: gc.column })),
        };
        if (f.disabled) { bf.d = f.disabled; }
        if (f.baseLayerId) { bf.l = f.baseLayerId; }
        if (f.buffer) { bf.b = f.buffer; }
        if (f.geometries) { bf.g = f.geometries.map(g => ({ id: g.id, g: g.geometry, l: g.referenceLayerId })); }
        return bf;
      });

      if (!bookmarkData.s) {
        bookmarkData.s = [];
      }
      bookmarkData.s.push(bfg);
    }
  }

  public static spatialFilterGroupFromBookmark(bfg: BookmarkFilterGroup<BookmarkSpatialFilterModel>): FilterGroupModel<SpatialFilterModel> {
    return {
      id: bfg.id,
      source: 'SPATIAL_FILTER_FORM',
      layerIds: bfg.l,
      type: FilterTypeEnum.SPATIAL,
      disabled: bfg.d,
      parentGroup: bfg.pG,
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
