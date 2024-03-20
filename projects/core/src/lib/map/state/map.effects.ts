import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as MapActions from './map.actions';
import { combineLatest, catchError, concatMap, map, of, take } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';

import * as CoreActions from '../../state/core.actions';
import { ApplicationBookmarkService } from '../../services/application-bookmark/application-bookmark.service';
import { BookmarkService } from '../../services/bookmark/bookmark.service';
import { MapBookmarkHelper } from '../../services/application-bookmark/bookmark.helper';
import { ApplicationBookmarkFragments } from '../../services/application-bookmark/application-bookmark-fragments';

@Injectable()
export class MapEffects {

  private static LOAD_MAP_ERROR = $localize `:@@core.common.error-loading-map:Could not load map settings`;

  public triggerLoadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewerSuccess),
      map(action => MapActions.loadMap({ id: action.viewer.id })),
    );
  });

  public loadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MapActions.loadMap),
      concatMap(action => {
        return this.apiService.getMap$(action.id)
          .pipe(
            catchError(() => of(MapEffects.LOAD_MAP_ERROR)),
            concatMap(response => {
              if (typeof response === 'string') {
                return of(MapActions.loadMapFailed({ error: response }));
              }
              return combineLatest([
                this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.VISIBILITY_BOOKMARK_DESCRIPTOR),
                this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR),
              ])
                .pipe(
                  take(1),
                  map(([ opacityVisibilityFragment, layerOrderFragment ]) => {
                    const extendedMapResponse = MapBookmarkHelper.mergeMapResponseWithBookmarkData(response, opacityVisibilityFragment, layerOrderFragment);
                    return MapActions.loadMapSuccess(extendedMapResponse);
                  }),
                );
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    @Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel,
    private bookmarkService: BookmarkService,
  ) {}

}
