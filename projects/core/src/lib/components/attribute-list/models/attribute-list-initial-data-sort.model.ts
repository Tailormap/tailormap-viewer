
/* Model to describe initial data sorting configuration for attribute lists, when a tab is not added yet and the dataId is not yet known */
export interface AttributeListInitialDataSortModel {
  tabSourceId: string;
  layerId: string;
  sortedColumn: string;
  sortDirection: 'asc' | 'desc';
  /* If the sort order can be configured in the admin in the future, keep that setting separate from the sort order set by the bookmark.
   * That allows us to have a 'reset to start' option for sorting as well which would reset to 'config' sorting and remove 'bookmark'
   * initial sorts from the state. For new tabs, the 'bookmark' source takes precedence.
   */
  source: 'config' | 'bookmark';
}

export type AttributeListInitialDataSortModelWithoutSource = Omit<AttributeListInitialDataSortModel, 'source'>;
