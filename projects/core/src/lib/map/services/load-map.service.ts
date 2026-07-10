import { inject, Injectable } from '@angular/core';
import { catchError, combineLatest, concatMap, map, of, take } from 'rxjs';
import {
  ApplicationBookmarkFragments, LayerSettingsBookmarkFragment, LayerTreeOrderBookmarkFragment,
} from '../../services/application-bookmark/application-bookmark-fragments';
import { MapBookmarkHelper } from '../../services/application-bookmark/map-bookmark.helper';
import { TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { BookmarkService } from '../../services/bookmark/bookmark.service';
import { Store } from '@ngrx/store';
import { loadMapFailed, loadMapSuccess } from '../state/map.actions';

@Injectable({
  providedIn: 'root',
})
export class LoadMapService {

  private apiService = inject(TAILORMAP_API_V1_SERVICE);
  private bookmarkService = inject(BookmarkService);
  private store$ = inject(Store);

  private static LOAD_MAP_ERROR = $localize `:@@core.common.error-loading-map:Could not load map settings`;

  public loadMap(id: string) {
    this.apiService.getMap$(id)
      .pipe(
        catchError(() => of(LoadMapService.LOAD_MAP_ERROR)),
        concatMap(response => {
          if (typeof response === 'string') {
            return of(response);
          }
          return combineLatest([
            this.bookmarkService.registerFragment$<LayerSettingsBookmarkFragment>(ApplicationBookmarkFragments.LAYER_SETTINGS_BOOKMARK_DESCRIPTOR),
            this.bookmarkService.registerFragment$<LayerTreeOrderBookmarkFragment>(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR),
          ])
            .pipe(
              take(1),
              map(([ layerSettingsFragment, layerOrderFragment ]) => {
                return MapBookmarkHelper.mergeMapResponseWithBookmarkData(response, layerSettingsFragment, layerOrderFragment);
              }),
            );
        }),
      )
      .subscribe(response => {
        if (typeof response === 'string') {
          this.store$.dispatch(loadMapFailed({ error: response }));
        } else {
          this.store$.dispatch(loadMapSuccess(response));
        }
      });
  }

}
