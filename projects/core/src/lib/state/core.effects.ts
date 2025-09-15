import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CoreActions from './core.actions';
import * as FilterActions from '../filter/state/filter.actions';
import { concatMap, map, tap, filter } from 'rxjs';
import { LoadViewerService } from '../services/load-viewer.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { UrlHelper } from '@tailormap-viewer/shared';
import { AttributeFilterService } from '../services/attribute-filter.service';

@Injectable()
export class CoreEffects {
  private actions$ = inject(Actions);
  private loadViewerService = inject(LoadViewerService);
  private location = inject(Location);
  private router = inject(Router);


  private attributeFilterService = inject(AttributeFilterService);

  public loadViewer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewer),
      concatMap(action => {
        return this.loadViewerService.loadViewer$(action.id)
          .pipe(
            map(response => {
              if (!response.success || !response.result) {
                return CoreActions.loadViewerFailed({ error: response.error });
              }
              const viewer = response.result.viewer;
              return CoreActions.loadViewerSuccess({
                viewer: { ...viewer, id: `${viewer.kind}/${viewer.name}` },
              });
            }),
          );
      }),
    );
  });

  public addFilterGroups$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewerSuccess),
      map(action => action.viewer.filterGroups || []),
      map(groups => this.attributeFilterService.separateSubstringFiltersInCheckboxFilters(groups)),
      tap(groups => this.attributeFilterService.disableFiltersForMissingAttributes$(groups)),
      map(filterGroups => FilterActions.addAllFilterGroupsInConfig({ filterGroups })),
    );
  });

  public updateUrlAfterViewerLoad$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewerSuccess),
      map(action => action.viewer.id.split('/').map(UrlHelper.getUrlSafeParam)),
      filter(paths => this.location.path() !== '/' + paths.join('/')),
      tap(paths => this.router.navigate(paths, { preserveFragment: true, skipLocationChange: true })),
    );
  }, { dispatch: false });

}
