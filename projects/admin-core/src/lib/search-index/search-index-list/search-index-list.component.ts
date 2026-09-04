import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Observable, of, take } from 'rxjs';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectCatalogLoadStatus } from '../../catalog/state/catalog.selectors';
import { CatalogService } from '../../catalog/services/catalog.service';
import {
  SearchIndexList, selectFilteredSearchIndexesList, selectSearchIndexesListFilter, selectSearchIndexesLoadError,
  selectSearchIndexesLoadStatus,
} from '../state/search-index.selectors';
import { setSearchIndexListFilter } from '../state/search-index.actions';
import { FormControl } from '@angular/forms';
import { SearchIndexService } from '../services/search-index.service';

@Component({
  selector: 'tm-admin-search-index-list',
  templateUrl: './search-index-list.component.html',
  styleUrls: ['./search-index-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchIndexListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogService);
  private searchIndexService = inject(SearchIndexService);


  public filter = new FormControl('');
  public searchIndexes$: Observable<SearchIndexList> = of([]);
  public searchIndexesLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public filterTerm$ = this.store$.select(selectSearchIndexesListFilter);

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.store$.dispatch(setSearchIndexListFilter({ filter: value }));
      });
    this.searchIndexesLoadStatus$ = this.store$.select(selectSearchIndexesLoadStatus);
    this.errorMessage$ = this.store$.select(selectSearchIndexesLoadError);
    this.searchIndexes$ = this.store$.select(selectFilteredSearchIndexesList);
    this.searchIndexesLoadStatus$
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.searchIndexService.loadSearchIndexes();
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
    this.searchIndexService.loadSearchIndexes();
  }

}
