import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class I18nPaginatorIntl extends MatPaginatorIntl {
  public override firstPageLabel = $localize`:@@shared.paginator.first-page:First page`;
  public override lastPageLabel = $localize`:@@shared.paginator.last-page:Last page`;
  public override nextPageLabel = $localize`:@@shared.paginator.next-page:Next page`;
  public override previousPageLabel = $localize`:@@shared.paginator.previous-page:Previous page`;
  public override itemsPerPageLabel = $localize`:@@shared.paginator.items-per-page:Items per page`;

  public override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) {
      return $localize`:@@shared.paginator.range-label-empty:0 of 0`;
    }
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return $localize`:@@shared.paginator.range-label:${start} - ${end} of ${length}`;
  };
}
