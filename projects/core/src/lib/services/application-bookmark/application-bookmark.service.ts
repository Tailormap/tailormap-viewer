import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, map, skip, Subject, takeUntil } from 'rxjs';
import { selectLoadStatus, selectLayers, selectLayerTreeNodes } from '../../map/state/map.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkService } from '../bookmark/bookmark.service';
import { MapBookmarkHelper } from './bookmark.helper';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationBookmarkFragments } from './application-bookmark-fragments';
import { LayerTreeOrderBookmarkFragment, LayerVisibilityBookmarkFragment } from './bookmark_pb';
import { withLatestFrom } from 'rxjs/operators';
import { setLayerOpacity, setLayerVisibility, updateLayerTreeNodes } from '../../map/state/map.actions';

@Injectable({
  providedIn: 'root',
})
export class ApplicationBookmarkService implements OnDestroy {

  private destroyed = new Subject();
  private lastLocationBookmark: string | undefined;
  private lastVisibilityBookmark: LayerVisibilityBookmarkFragment | undefined;
  private lastOrderingBookmark: LayerTreeOrderBookmarkFragment | undefined;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private route: ActivatedRoute,
    private router: Router,
    private bookmarkService: BookmarkService,
  ) {
    let initialRun = true;
    this.route.fragment
      .pipe(takeUntil(this.destroyed))
      .subscribe(fragment => {
        this.bookmarkService.setBookmark(fragment === null ? undefined : fragment);
        if (initialRun) {
          this.updateBookmarkOnChanges();
          this.updateMapOnUrlChanges();
        }
        initialRun = false;
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public isEmbeddedApplication$() {
    return this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.EMBED_BOOKMARK_DESCRIPTOR)
      .pipe(map(embedded => embedded === '1'));
  }

  private updateBookmarkOnChanges() {
    this.getVisibilityBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.lastVisibilityBookmark = bookmark;
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.VISIBILITY_BOOKMARK_DESCRIPTOR, bookmark);
      });
    this.getOrderBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.lastOrderingBookmark = bookmark;
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR, bookmark);
      });
    this.getLocationBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.lastLocationBookmark = bookmark;
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.LOCATION_BOOKMARK_DESCRIPTOR, bookmark);
      });

    this.bookmarkService.getBookmarkValue$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.router.navigate([], { relativeTo: this.route, fragment: bookmark, replaceUrl: true });
      });
  }

  private updateMapOnUrlChanges() {
    this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.LOCATION_BOOKMARK_DESCRIPTOR)
      .pipe(
        skip(1),
        takeUntil(this.destroyed),
        filter(locationBookmark => locationBookmark !== this.lastLocationBookmark),
      )
      .subscribe(locationBookmark => {
        const bookmark = MapBookmarkHelper.locationAndZoomFromFragment(locationBookmark);
        if (bookmark) {
          this.mapService.setCenterAndZoom(bookmark[0], bookmark[1]);
        }
      });

    this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.VISIBILITY_BOOKMARK_DESCRIPTOR)
      .pipe(
        skip(1),
        takeUntil(this.destroyed),
        filter(visBookmark => !this.lastVisibilityBookmark?.equals(visBookmark)),
        withLatestFrom(this.store$.select(selectLayers)),
      )
      .subscribe(([ visBookmark, extendedAppLayers ]) => {
        const visibilityChanges = MapBookmarkHelper.visibilityDataFromFragment(visBookmark, extendedAppLayers, false);
        this.store$.dispatch(setLayerVisibility({ visibility: visibilityChanges.visibilityChanges }));
        this.store$.dispatch(setLayerOpacity({ opacity: visibilityChanges.opacityChanges }));
      });

    this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR)
      .pipe(
        skip(1),
        takeUntil(this.destroyed),
        filter(orderBookmark => !this.lastOrderingBookmark?.equals(orderBookmark)),
        withLatestFrom(this.store$.select(selectLayerTreeNodes)),
      )
      .subscribe(([ orderBookmark, layerTreeNodes ]) => {
        const bookmarkLayerOrder = MapBookmarkHelper.layerTreeOrderFromFragment(orderBookmark, layerTreeNodes);
        const updatedLayerTreeNodes = layerTreeNodes.map(node => {
          const matches = bookmarkLayerOrder.find(a => a.nodeId === node.id);
          if (matches !== undefined) {
            return {
              ...node,
              childrenIds: matches.children,
            };
          }
          return node;
        });
        this.store$.dispatch(updateLayerTreeNodes({ layerTreeNodes: updatedLayerTreeNodes }));
      });
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
