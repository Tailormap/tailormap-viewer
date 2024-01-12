import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, map, Subject, takeUntil } from 'rxjs';
import { selectLoadStatus, selectLayers, selectLayerTreeNodes } from '../state/map.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  BookmarkProtoFragmentDescriptor, BookmarkStringFragmentDescriptor,
} from '../../bookmark/bookmark.models';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { LayerVisibilityBookmarkFragment, LayerTreeOrderBookmarkFragment } from '../bookmark/bookmark_pb';
import { MapBookmarkHelper } from '../bookmark/bookmark.helper';

@Injectable({
  providedIn: 'root',
})
export class ApplicationMapBookmarkService implements OnDestroy {

  public static LOCATION_BOOKMARK_DESCRIPTOR: BookmarkStringFragmentDescriptor = new BookmarkStringFragmentDescriptor('');
  public static VISIBILITY_BOOKMARK_DESCRIPTOR: BookmarkProtoFragmentDescriptor<LayerVisibilityBookmarkFragment>
    = new BookmarkProtoFragmentDescriptor('1', LayerVisibilityBookmarkFragment);

  public static ORDERING_BOOKMARK_DESCRIPTOR: BookmarkProtoFragmentDescriptor<LayerTreeOrderBookmarkFragment>
    = new BookmarkProtoFragmentDescriptor<LayerTreeOrderBookmarkFragment>('2', LayerTreeOrderBookmarkFragment);

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private mapService: MapService,
    private bookmarkService: BookmarkService,
  ) {
    this.getVisibilityBookmarkData$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationMapBookmarkService.VISIBILITY_BOOKMARK_DESCRIPTOR, bookmark);
      });

    this.getOrderBookmarkData$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationMapBookmarkService.ORDERING_BOOKMARK_DESCRIPTOR, bookmark);
      });

    this.getLocationBookmarkData$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationMapBookmarkService.LOCATION_BOOKMARK_DESCRIPTOR, bookmark);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private getVisibilityBookmarkData$() {
    return combineLatest([
      this.store$.select(selectLayers),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([ , loadStatus ]) => loadStatus === LoadingStateEnum.LOADED),
      map(([layers]) => {
        return MapBookmarkHelper.fragmentFromVisibilityData(layers);
      }),
    );
  }

  private getOrderBookmarkData$() {
    return combineLatest([
      this.store$.select(selectLayerTreeNodes),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([ , loadStatus ]) => loadStatus === LoadingStateEnum.LOADED),
      map(([layers]) => {
        return MapBookmarkHelper.fragmentFromLayerTreeOrder(layers);
      }),
    );
  }

  private getLocationBookmarkData$() {
    return combineLatest([ this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$() ])
      .pipe(
        map(([ info, measure ]) => MapBookmarkHelper.fragmentFromLocationAndZoom(info, measure)),
        filter((fragment): fragment is string => fragment !== undefined),
      );
  }

}
