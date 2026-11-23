import { AttributeListPagingDataType } from '../models/attribute-list-paging-data.type';

export class AttributeListPagingHelper {

  /**
   * Determines the paging data for the paginator. A source may not know the total number of features (total null or negative,
   * for example a WFS 2.0.0 server that does not return numberMatched). In that case the next page is allowed as long as the
   * current page is full, and the total becomes known when a page is not full.
   * @param id The data id
   * @param totalCount The total as reported by the source
   * @param pageIndex The 1-based page index
   * @param pageSize The page size
   * @param rowCount The number of rows on the current page
   * @param loading Whether a page is loading. The page index is updated before loading, but the rows are still those of the
   * previous page, so the rows can not be used to derive the total.
   */
  public static getPagingData(
    id: string,
    totalCount: number | null,
    pageIndex: number,
    pageSize: number,
    rowCount: number,
    loading = false,
  ): AttributeListPagingDataType {
    if (loading && !AttributeListPagingHelper.isTotalCountKnown(totalCount)) {
      return { id, totalCount, pageIndex, pageSize, knownTotalCount: null, paginatorLength: Math.max(pageIndex, 0) * pageSize };
    }
    const knownTotalCount = AttributeListPagingHelper.getKnownTotalCount(totalCount, pageIndex, pageSize, rowCount);
    let paginatorLength = knownTotalCount;
    if (paginatorLength === null) {
      const offset = Math.max(pageIndex - 1, 0) * pageSize;
      paginatorLength = offset + rowCount + (rowCount >= pageSize ? 1 : 0);
    }
    return { id, totalCount, pageIndex, pageSize, knownTotalCount, paginatorLength };
  }

  private static isTotalCountKnown(totalCount: number | null): totalCount is number {
    return totalCount !== null && totalCount >= 0;
  }

  private static getKnownTotalCount(totalCount: number | null, pageIndex: number, pageSize: number, rowCount: number): number | null {
    if (AttributeListPagingHelper.isTotalCountKnown(totalCount)) {
      return totalCount;
    }
    if (pageSize <= 0) {
      return rowCount;
    }
    // A page that is not full is the last page, unless it is an empty page after the first page: then the total is still unknown
    // (the user may have jumped past the last page).
    if (rowCount < pageSize && (rowCount > 0 || pageIndex <= 1)) {
      return Math.max(pageIndex - 1, 0) * pageSize + rowCount;
    }
    return null;
  }

}
