import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as MapActions from './map.actions';
import { catchError, concatMap, mergeMap, map, of, combineLatest, filter, distinctUntilChanged, withLatestFrom } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';

import * as CoreActions from '../../state/core.actions';
import { ServerTypeHelper } from '@tailormap-viewer/map';

import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectChangedLayers, selectLayers, selectLoadStatus } from './map.selectors';
import { setLayerVisibility } from './map.actions';
import { setBookmarkData, appliedBookmarkData } from '../../bookmark/bookmark.actions';
import { BookmarkType, LayerAndFlagsFragmentType } from '../../bookmark/bookmark.model';
import { selectHasUnappliedFragment, selectUnappliedFragment } from '../../bookmark/bookmark.selectors';

type BookmarkFlags = {
  visible: boolean;
};

@Injectable()
export class MapEffects {

  private static LOAD_MAP_ERROR = $localize`Could not load map settings`;
  private static BOOKMARK_TYPE: LayerAndFlagsFragmentType<BookmarkFlags> = {
    type: 'layerandflags',
    flagTypes: ['visible'],
  };

  public triggerLoadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadApplicationSuccess),
      map(action => MapActions.loadMap({ id: action.application.id })),
    );
  });

  public loadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MapActions.loadMap),
      concatMap(action => {
        return this.apiService.getMap$(action.id)
          .pipe(
            catchError(() => of(MapEffects.LOAD_MAP_ERROR)),
            map(response => {
              if (typeof response === 'string') {
                return MapActions.loadMapFailed({ error: response });
              }
              response.services = response.services.map(service => ({
                ...service,
                // resolve 'auto' server types for services for server-specific features such as hi dpi maps and legends, etc.
                resolvedServerType: ServerTypeHelper.resolveAutoServerType(service),
              }));
              return MapActions.loadMapSuccess({
                ...response,
              });
            }),
          );
      }),
    );
  });

  public setBookmarkFromLayerVisibility$ = createEffect(() => {
    const loadingStateChanged$ = this.store$.select(selectLoadStatus).pipe(distinctUntilChanged());
    const changedLayers$ = this.store$.select(selectChangedLayers);
    const hasUnappliedFragment$ = this.store$.select(selectHasUnappliedFragment(BookmarkType.LAYER_VISIBILITY));

    return combineLatest([ changedLayers$, loadingStateChanged$, hasUnappliedFragment$ ])
      .pipe(
        filter(([ , loadingState, hasUnappliedFragment ]) => loadingState === LoadingStateEnum.LOADED && !hasUnappliedFragment),
        map(([layers]) => setBookmarkData({
          data: {
            id: BookmarkType.LAYER_VISIBILITY,
            value: { ...MapEffects.BOOKMARK_TYPE, data: layers.map(a => ({ id: a.id, data: { visible: a.visible } })) },
          },
        })));
  });

  public setLayerVisibilityFromBookmark$ = createEffect(() => {
    const unappliedFragment$ = this.store$.select(selectUnappliedFragment(BookmarkType.LAYER_VISIBILITY, MapEffects.BOOKMARK_TYPE));
    const layers$ = this.store$.select(selectLayers);
    const changedLayers$ = this.store$.select(selectChangedLayers);
    const loadingStateChanged$ = this.store$.select(selectLoadStatus); //.pipe(distinctUntilChanged());

    return combineLatest([ unappliedFragment$, changedLayers$, loadingStateChanged$ ])
      .pipe(
        withLatestFrom(layers$),
        filter(([[ , , loadingState ]]) => loadingState === LoadingStateEnum.LOADED),
        mergeMap(([[ bookmark, changedLayers ], layers ]) => {
          if (bookmark === undefined) {
            return [];
          }

          const changes = [];
          const items = bookmark.data;
          for (const layer of items) {
            if (layers.find(a => a.id === layer.id) === undefined) {
              // We got a layer that does not exist anymore. Skip it.
              continue;
            }

            const changedLayer = changedLayers.find(a => a.id === layer.id);
            if (changedLayer === undefined || changedLayer.visible !== layer.data.visible) {
              changes.push({ id: layer.id, checked: layer.data.visible });
            }
          }

          for (const layer of changedLayers) {
            if (items.find(a => a.id === layer.id) === undefined) {
              changes.push({ id: layer.id, checked: !layer.visible });
            }
          }

          if (changes.length === 0) {
            return [appliedBookmarkData({ bookmark: { id: BookmarkType.LAYER_VISIBILITY, value: bookmark } })];
          } else {
            return [setLayerVisibility({ visibility: changes })];
          }
        }));
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    @Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel,
  ) {}

}
