import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FeatureInfoActions from './feature-info.actions';
import { selectMapCoordinates, selectFeatureInfoDialogVisible, selectFeatureInfoLoadStatus } from './feature-info.selectors';
import { map, switchMap, mergeMap, combineLatest, filter, distinctUntilChanged } from 'rxjs';
import { FeatureInfoService } from '../feature-info.service';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';
import { selectLoadStatus } from '../../../map/state/map.selectors';

import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkType } from '../../../bookmark/bookmark.model';
import { setBookmarkData, unsetBookmarkData, appliedBookmarkData } from '../../../bookmark/bookmark.actions';
import { selectHasUnappliedFragment, selectUnappliedFragment } from '../../../bookmark/bookmark.selectors';

@Injectable()
export class FeatureInfoEffects {

  public loadFeatureInfo$ = createEffect(() => {
      return this.actions$.pipe(
          ofType(FeatureInfoActions.loadFeatureInfo),
          switchMap(action => {
            return this.featureInfoService.getFeatures$(action.mapCoordinates)
              .pipe(
                map(result => {
                  if (!result) {
                    return FeatureInfoActions.loadFeatureInfoFailed({});
                  }
                  return FeatureInfoActions.loadFeatureInfoSuccess({ featureInfo: result });
                }),
              );
          }),
      );
  });

  public showDialogOnFeatureInfoSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FeatureInfoActions.loadFeatureInfoSuccess),
      map(action => {
        const count = FeatureInfoHelper.getTotalFeatureInfoCount(action.featureInfo);
        if (count === 0) {
          return FeatureInfoActions.hideFeatureInfoDialog();
        }
        return FeatureInfoActions.showFeatureInfoDialog();
      }),
    );
  });

  public setBookmarkFromFeatureInfo$ = createEffect(() => {
    const dialogVisible$ = this.store$.select(selectFeatureInfoDialogVisible).pipe(distinctUntilChanged());
    const dialogLoadStatus$ = this.store$.select(selectFeatureInfoLoadStatus).pipe(distinctUntilChanged());
    const mapCoordinates$ = this.store$.select(selectMapCoordinates).pipe(distinctUntilChanged());
    const hasUnappliedFragment$ = this.store$.select(selectHasUnappliedFragment(BookmarkType.FEATURE_COORDINATES));
    const mapLoadStatus$ = this.store$.select(selectLoadStatus);

    return combineLatest([dialogVisible$, mapCoordinates$, dialogLoadStatus$, hasUnappliedFragment$, mapLoadStatus$])
      .pipe(
        // Wait until the map is loaded.
        filter(([, , , , mapLoadStatus]) => mapLoadStatus === LoadingStateEnum.LOADED),

        // Only set the bookmark if we have fully loaded.
        filter(([, , dialogLoadStatus, hasUnappliedFragment]) =>
          !hasUnappliedFragment &&
          (dialogLoadStatus === LoadingStateEnum.LOADED || dialogLoadStatus === LoadingStateEnum.INITIAL),
        ),
        map(([dialogVisible, mapCoordinates]) => {
          if (mapCoordinates === undefined || !dialogVisible) {
            return unsetBookmarkData({
              id: BookmarkType.FEATURE_COORDINATES,
            });
          }

          return setBookmarkData({
            data: {
              id: BookmarkType.FEATURE_COORDINATES,
              value: {
                type: 'position',
                position: mapCoordinates,
              },
            },
          });
        }));
  });

  public loadFeatureInfoFromBookmark$ = createEffect(() => {
    const unappliedFragment$ = this.store$.select(selectUnappliedFragment(BookmarkType.FEATURE_COORDINATES, { type: 'position' }));
    const layerVisibilityUnapplied$ = this.store$.select(selectHasUnappliedFragment(BookmarkType.LAYER_VISIBILITY));
    const mapCoordinates$ = this.store$.select(selectMapCoordinates);
    const featureInfoLoadStatus$ = this.store$.select(selectFeatureInfoLoadStatus);
    const mapLoaded$ = this.store$.select(selectLoadStatus);

    return combineLatest([unappliedFragment$, mapCoordinates$, featureInfoLoadStatus$, mapLoaded$, layerVisibilityUnapplied$])
      .pipe(
        // Wait until the map is loaded and has applied its bookmark data (if any)
        filter(([, , , mapLoaded, layerVisibilityUnapplied]) => mapLoaded === LoadingStateEnum.LOADED && !layerVisibilityUnapplied),

        // Only try to apply our own feature info if there's no pending data being loaded.
        filter(([, , featureInfoLoadStatus]) => featureInfoLoadStatus === LoadingStateEnum.LOADED || featureInfoLoadStatus === LoadingStateEnum.INITIAL),

        mergeMap(([unappliedFragment, mapCoordinates]) => {
          if (unappliedFragment === undefined) {
            return [];
          }

          if (mapCoordinates === undefined) {
            return [FeatureInfoActions.loadFeatureInfo({ mapCoordinates: unappliedFragment.position })];
          }

          if (Math.abs(mapCoordinates[0] - unappliedFragment.position[0]) <= Number.EPSILON && Math.abs(mapCoordinates[1] - unappliedFragment.position[1]) <= Number.EPSILON) {
            return [appliedBookmarkData({ bookmark: { id: BookmarkType.FEATURE_COORDINATES, value: unappliedFragment } })];
          }

          return [FeatureInfoActions.loadFeatureInfo({ mapCoordinates: unappliedFragment.position })];
        }));
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private featureInfoService: FeatureInfoService,
  ) {}

}
