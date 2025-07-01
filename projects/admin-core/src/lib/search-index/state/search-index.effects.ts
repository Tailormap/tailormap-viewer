import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import * as SearchIndexActions from './search-index.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import { ApiResponseHelper, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectSearchIndexesLoadStatus } from './search-index.selectors';

@Injectable()
export class SearchIndexEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private adminApiService = inject(TailormapAdminApiV1Service);


  public loadSearchIndexes$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SearchIndexActions.loadSearchIndexes, SearchIndexActions.reloadSearchIndexes),
      concatLatestFrom(() => this.store$.select(selectSearchIndexesLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(SearchIndexActions.loadSearchIndexesStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getSearchIndexes$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.search-index.error-loading-search-indexes:Error while loading list of search indexes` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return SearchIndexActions.loadSearchIndexesFailed({ error: response.error });
              }
              return SearchIndexActions.loadSearchIndexesSuccess({ searchIndexes: response });
            }),
          );
      }),
    );
  });

}
