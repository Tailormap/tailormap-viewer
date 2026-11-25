import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class I18nPaginatorIntl extends MatPaginatorIntl {
  public override firstPageLabel = $localize`:@@shared.paginator.first-page:First page`;
  public override lastPageLabel = $localize`:@@shared.paginator.last-page:Last page`;
  public override nextPageLabel = $localize`:@@shared.paginator.next-page:Next page`;
  public override previousPageLabel = $localize`:@@shared.paginator.previous-page:Previous page`;
  public override itemsPerPageLabel = $localize`:@@shared.paginator.items-per-page:Items per page`;

  private totalUnknown = false;

  /**
   * Set whether the total is unknown. The range label then shows "of unknown" instead of the length given to the paginator,
   * which is only used to determine whether there is a next page.
   */
  public setTotalUnknown(totalUnknown: boolean) {
    if (this.totalUnknown === totalUnknown) {
      return;
    }
    this.totalUnknown = totalUnknown;
    this.changes.next();
  }

  public override getRangeLabel = (page: number, pageSize: number, length: number) => {
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    if (this.totalUnknown) {
      if (end < start) {
        // Only happens for a page past the last page, for example after going to a page number that is too high
        const pageNumber = page + 1;
        return $localize`:@@shared.paginator.range-label-empty-page:Page ${pageNumber} is empty`;
      }
      return $localize`:@@shared.paginator.range-label-unknown:${start} - ${end} of unknown`;
    }
    if (length === 0) {
      return $localize`:@@shared.paginator.range-label-empty:0 of 0`;
    }
    return $localize`:@@shared.paginator.range-label:${start} - ${end} of ${length}`;
  };
}
