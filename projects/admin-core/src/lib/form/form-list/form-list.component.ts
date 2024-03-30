import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of, take } from 'rxjs';
import { FormSummaryModel } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { loadForms, setFormListFilter } from '../state/form.actions';
import {
  selectFilteredFormsList, selectFormsLoadError, selectFormsLoadStatus,
} from '../state/form.selectors';
import { selectCatalogLoadStatus } from '../../catalog/state/catalog.selectors';
import { loadCatalog } from '../../catalog/state/catalog.actions';

@Component({
  selector: 'tm-admin-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormListComponent implements OnInit {

  public filter = new FormControl('');
  public forms$: Observable<Array<FormSummaryModel & { selected: boolean }>> = of([]);
  public formsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.store$.dispatch(setFormListFilter({ filter: value }));
      });
    this.formsLoadStatus$ = this.store$.select(selectFormsLoadStatus);
    this.errorMessage$ = this.store$.select(selectFormsLoadError);
    this.forms$ = this.store$.select(selectFilteredFormsList);
    this.formsLoadStatus$
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadForms());
        }
      });
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

  public onRetryClick() {
    this.store$.dispatch(loadForms());
  }

}
