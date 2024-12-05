import { DestroyRef, Injectable } from '@angular/core';
import { SearchIndexModel, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { Store } from '@ngrx/store';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DebounceHelper } from '@tailormap-viewer/shared';
import { addSearchIndex, deleteSearchIndex, updateSearchIndex } from '../state/search-index.actions';
import { catchError, concatMap, map, of } from 'rxjs';
import { selectDraftSearchIndex } from '../state/search-index.selectors';

@Injectable({
  providedIn: 'root',
})
export class SearchIndexService {

  public constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
    private destroyRef: DestroyRef,
  ) {}

  public listenForSearchIndexChanges() {
    this.sseService.listenForEvents$<SearchIndexModel>('SearchIndex')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateSearchIndexState(event.details.object.id, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateSearchIndexState(event.details.object.id, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateSearchIndexState(event.details.id, 'remove');
        }
      });
  }

  public saveDraftSearchIndex$() {
    return this.store$.select(selectDraftSearchIndex)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        concatMap(searchIndex => {
          if (searchIndex) {
            return this.updateSearchIndex$(searchIndex.id, searchIndex);
          }
          return of(null);
        }),
      );
  }

  public createSearchIndex$(searchIndex: Omit<SearchIndexModel, 'id'>) {
    return this.adminApiService.createSearchIndex$({ searchIndex })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.error-creating-search-index:Error while creating search index.`);
          return of(null);
        }),
        map(createSearchIndex => {
          if (createSearchIndex) {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.search-index-created:Search index created`);
            this.updateSearchIndexState(createSearchIndex.id, 'add', createSearchIndex);
            return createSearchIndex;
          }
          return null;
        }),
      );
  }

  public updateSearchIndex$(id: number, searchIndex: Partial<SearchIndexModel>) {
    return this.adminApiService.updateSearchIndex$({ id, searchIndex })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.error-updating-search-index:Error while updating search index.`);
          return of(null);
        }),
        map(updatedSearchIndex => {
          if (updatedSearchIndex) {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.search-index-updated:Search index updated`);
            this.updateSearchIndexState(updatedSearchIndex.id, 'update', updatedSearchIndex);
            return updatedSearchIndex;
          }
          return null;
        }),
      );
  }

  public deleteSearchIndex$(id: number) {
    return this.adminApiService.deleteSearchIndex$(id)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.error-deleting-search-index:Error while deleting search index.`);
          return of(null);
        }),
        map(success => {
          if (success) {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.search-index-removed:Search index removed`);
            this.updateSearchIndexState(id, 'remove');
            return success;
          }
          return null;
        }),
      );
  }

  public reIndexSearchIndex$(id: number) {
    return this.adminApiService.reindexSearchIndex$(id)
      .pipe(
        catchError(() => {
          return of(false);
        }),
        map(success => {
          if (success) {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.search-reindex-success:Re-indexing request queued`);
            return success;
          } else {
            this.adminSnackbarService.showMessage($localize `:@@admin-core.search-index.reindex-error:Error while re-indexing search index.`);
          }
          return false;
        }),
      );
  }

  private updateSearchIndexState(
    id: string | number,
    type: 'add' | 'update' | 'remove',
    searchIndex?: SearchIndexModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`searchIndex-${type}-${id}`, () => {
      if (type === 'add' && searchIndex) {
        this.store$.dispatch(addSearchIndex({ searchIndex }));
      }
      if (type === 'update' && searchIndex) {
        this.store$.dispatch(updateSearchIndex({ searchIndex }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteSearchIndex({ searchIndexId: +id }));
      }
    }, 50);
  }

}
