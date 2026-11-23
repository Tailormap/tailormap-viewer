export type AttributeListPagingDataType = {
  id: string;
  /**
   * The total as reported by the source. Null or negative when the source does not know the total (for example a WFS 2.0.0 server
   * without numberMatched).
   */
  totalCount: number | null;
  /** 1-based page index */
  pageIndex: number;
  pageSize: number;
  /**
   * The total if it is known: reported by the source, or derived from the rows when the current page is the last page (not full).
   * Null when unknown.
   */
  knownTotalCount: number | null;
  /**
   * The length for the paginator. When the total is unknown and the current page is full, this is one more than the number of
   * features up to and including the current page, so the paginator allows going to the next page.
   */
  paginatorLength: number;
};
