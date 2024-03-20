import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, map, skip, Subject, take, takeUntil } from 'rxjs';
import { selectLoadStatus, selectLayers, selectLayerTreeNodes } from '../../map/state/map.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkService } from '../bookmark/bookmark.service';
import { MapBookmarkHelper } from './bookmark.helper';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationBookmarkFragments } from './application-bookmark-fragments';

@Injectable({
  providedIn: 'root',
})
export class ApplicationBookmarkService implements OnDestroy {

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private mapService: MapService,
    private route: ActivatedRoute,
    private router: Router,
    private bookmarkService: BookmarkService,
  ) {
    this.route.fragment
      .pipe(take(1))
      .subscribe(fragment => {
        this.bookmarkService.setBookmark(fragment === null ? undefined : fragment);
          this.updateBookmarkOnChanges();
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
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.VISIBILITY_BOOKMARK_DESCRIPTOR, bookmark);
      });
    this.getOrderBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR, bookmark);
      });
    this.getLocationBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.LOCATION_BOOKMARK_DESCRIPTOR, bookmark);
      });

    this.bookmarkService.getBookmarkValue$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
        this.router.navigate([], { relativeTo: this.route, fragment: bookmark, replaceUrl: true });
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
