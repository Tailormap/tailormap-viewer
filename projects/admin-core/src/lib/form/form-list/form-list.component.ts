import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of, take } from 'rxjs';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setFormListFilter } from '../state/form.actions';
import {
  FormList,
  selectFilteredFormsList, selectFormsListFilter, selectFormsLoadError, selectFormsLoadStatus,
} from '../state/form.selectors';
import { selectCatalogLoadStatus } from '../../catalog/state/catalog.selectors';
import { CatalogService } from '../../catalog/services/catalog.service';
import { FormService } from '../services/form.service';

@Component({
  selector: 'tm-admin-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogService);
  private formService = inject(FormService);


  public filter = new FormControl('');
  public filterValue$ = this.store$.select(selectFormsListFilter);
  public forms$: Observable<FormList> = of([]);
  public formsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

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
          this.formService.loadForms();
        }
      });
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.catalogService.loadCatalog();
        }
      });
  }

  public onRetryClick() {
    this.formService.loadForms();
  }

}
