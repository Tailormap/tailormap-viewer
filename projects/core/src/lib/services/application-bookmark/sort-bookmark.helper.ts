import { LayerSortBookmarkFragment } from './application-bookmark-fragments';
import {
  AttributeListInitialDataSortModel, AttributeListInitialDataSortModelWithoutSource,
} from '../../components/attribute-list/models/attribute-list-initial-data-sort.model';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../../components/attribute-list/models/attribute-list-default-source.const';

export class SortBookmarkHelper {
  public static initialSortDataFromFragment(b: LayerSortBookmarkFragment): AttributeListInitialDataSortModel[] {
    return b.map(e => ({
      tabSourceId: e.s ?? ATTRIBUTE_LIST_DEFAULT_SOURCE,
      layerId: e.l,
      sortedColumn: e.c,
      sortDirection: e.d ? 'desc' : 'asc',
      source: 'bookmark',
    }));
  }

  public static fragmentFromSortState(sortState: AttributeListInitialDataSortModelWithoutSource[]): LayerSortBookmarkFragment {
    return sortState.map(s => ({
      ...(s.tabSourceId !== ATTRIBUTE_LIST_DEFAULT_SOURCE ? { s: s.tabSourceId } : {}),
      l: s.layerId,
      c: s.sortedColumn,
      ...(s.sortDirection === 'desc' ? { d: true } : {}),
    }));
  }
}
