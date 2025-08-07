import { Component, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectPagingDataSelectedTab } from '../state/attribute-list.selectors';
import { debounceTime, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { updatePage } from '../state/attribute-list.actions';

@Component({
  selector: 'tm-attribute-list-paging-dialog',
  templateUrl: './attribute-list-paging-dialog.component.html',
  styleUrls: ['./attribute-list-paging-dialog.component.css'],
  standalone: false,
})
export class AttributeListPagingDialogComponent implements OnDestroy {
  private store$ = inject(Store);


  private destroyed = new Subject();
  public formControl = new FormControl<number>(1, []);

  constructor() {
    this.store$.select(selectPagingDataSelectedTab)
      .pipe(take(1))
      .subscribe(pagingData => {
        if (pagingData) {
          this.formControl.patchValue(pagingData.pageIndex, {
            emitEvent: false,
          });
          const validators: ValidatorFn[] = [
            Validators.min(1),
            Validators.pattern(/[1-9][0-9]*/),
          ];
          if (pagingData.totalCount) {
            validators.push(Validators.max(Math.floor(pagingData.totalCount / pagingData.pageSize)));
          }
          this.formControl.setValidators(validators);
        }
    });
    this.formControl.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        withLatestFrom(this.store$.select(selectPagingDataSelectedTab)),
        debounceTime(500),
      )
      .subscribe(([ value, pagingData ]) => {
        let page = value === null ? 1 : +value;
        if (pagingData.totalCount) {
          const max = Math.floor(pagingData.totalCount / pagingData.pageSize);
          if (page > max) {
            page = max;
          }
        }
        if (page < 0) {
          page = 0;
        }
        if (page === pagingData.pageIndex) {
          return;
        }
        this.store$.dispatch(updatePage({
          dataId: pagingData.id,
          page,
        }));
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public select($event: MouseEvent) {
    if ($event && $event.target instanceof HTMLInputElement) {
      $event.target.select();
    }
  }

}
