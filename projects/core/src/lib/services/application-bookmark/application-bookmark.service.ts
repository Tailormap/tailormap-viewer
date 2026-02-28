import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, debounceTime, filter, map, Observable, skip, Subject, switchMap, takeUntil, withLatestFrom } from 'rxjs';
import { selectLoadStatus, selectLayers, selectLayerTreeNodes } from '../../map/state/map.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkService } from '../bookmark/bookmark.service';
import { MapBookmarkHelper } from './map-bookmark.helper';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationBookmarkFragments, LayerTreeOrderBookmarkFragment, LayerVisibilityBookmarkFragment,
} from './application-bookmark-fragments';
import { setLayerOpacity, setLayerVisibility, updateLayerTreeNodes } from '../../map/state/map.actions';
import { ReadableVisibilityBookmarkHandlerService } from './bookmark-fragment-handlers/readable-visibility-bookmark-handler.service';
import { selectFilterState } from '../../state';
import { addFilterGroup } from '../../state/filter-state/filter.actions';
import { FilterBookmarkHelper } from './filter-bookmark.helper';

@Injectable({
  providedIn: 'root',
})
export class ApplicationBookmarkService implements OnDestroy {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookmarkService = inject(BookmarkService);
  private readableVisibilityBookmarkHandler = inject(ReadableVisibilityBookmarkHandlerService);


  private destroyed = new Subject();
  private lastLocationBookmark: string | undefined;
  private lastVisibilityBookmark: LayerVisibilityBookmarkFragment | undefined;
  private lastOrderingBookmark: LayerTreeOrderBookmarkFragment | undefined;
  //private lastFilterBookmark: FilterBookmarkFragment | undefined;

  constructor() {
    let initialRun = true;
    this.route.fragment
      .pipe(takeUntil(this.destroyed))
      .subscribe(fragment => {
        this.bookmarkService.setBookmark(fragment === null ? undefined : fragment);
        if (initialRun) {
          this.updateBookmarkOnChanges();
          this.readableVisibilityBookmarkHandler.updateBookmarkOnMapChanges();
          this.updateMapOnUrlChanges();
          this.readableVisibilityBookmarkHandler.updateMapOnBookmarkChanges();
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

  public getMobileLayoutOption$(): Observable<'enabled' | 'disabled' | 'auto'> {
    return this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.MOBILE_LAYOUT_BOOKMARK_DESCRIPTOR)
      .pipe(map(mobile => {
        if (mobile === '1') {
          return 'enabled';
        } else if (mobile === '0') {
          return 'disabled';
        } else {
          return 'auto';
        }
      }));
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
    this.getFilterBookmarkData$()
      .pipe(skip(1), takeUntil(this.destroyed))
      .subscribe(bookmark => {
        //this.lastFilterBookmark = bookmark;
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.FILTER_BOOKMARK_DESCRIPTOR, bookmark);
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

    this.bookmarkService.registerJsonFragment$(ApplicationBookmarkFragments.VISIBILITY_BOOKMARK_DESCRIPTOR)
      .pipe(
        skip(1),
        takeUntil(this.destroyed),
        filter(visBookmark => !this.deepEqualsVisibilityBookmark(this.lastVisibilityBookmark, visBookmark)),
        withLatestFrom(this.store$.select(selectLayers)),
      )
      .subscribe(([ visBookmark, extendedAppLayers ]) => {
        if ((visBookmark || []).length === 0) {
          return;
        }
        const visibilityChanges = MapBookmarkHelper.visibilityDataFromFragment(visBookmark, extendedAppLayers, false);
        this.store$.dispatch(setLayerVisibility({ visibility: visibilityChanges.visibilityChanges }));
        this.store$.dispatch(setLayerOpacity({ opacity: visibilityChanges.opacityChanges }));
      });

    this.bookmarkService.registerJsonFragment$(ApplicationBookmarkFragments.ORDERING_BOOKMARK_DESCRIPTOR)
      .pipe(
        skip(1),
        takeUntil(this.destroyed),
        filter(orderBookmark => !this.deepEqualsOrderBookmark(this.lastOrderingBookmark, orderBookmark)),
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

    this.store$.select(selectLoadStatus).pipe(
      takeUntil(this.destroyed),
      filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
      switchMap(() => this.bookmarkService.registerJsonFragment$(ApplicationBookmarkFragments.FILTER_BOOKMARK_DESCRIPTOR)),
      //filter(filterBookmark => !this.deepEqualsFilterBookmark(this.lastFilterBookmark, filterBookmark)),
      withLatestFrom(this.store$.select(selectFilterState)),
    ).subscribe(([ filterBookmark, filterState ]) => {
        console.log('Apply filter bookmark to filterState', filterBookmark, filterState);

        const currentFilterGroupIds = filterState.currentFilterGroups.map(fg => fg.id);
        filterBookmark?.al?.filter(bfg => !currentFilterGroupIds.includes(bfg.id)).forEach(bfg => {
          const filterGroup = FilterBookmarkHelper.attributeFilterGroupFromBookmark(bfg);
          this.store$.dispatch(addFilterGroup({ filterGroup }));
        });

        filterBookmark?.s?.filter(bfg => !currentFilterGroupIds.includes(bfg.id)).forEach(bfg => {
          const filterGroup = FilterBookmarkHelper.spatialFilterGroupFromBookmark(bfg);
          this.store$.dispatch(addFilterGroup({ filterGroup }));
        });

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
        debounceTime(250),
        map(([ info, measure ]) => MapBookmarkHelper.fragmentFromLocationAndZoom(info, measure)),
        filter((fragment): fragment is string => fragment !== undefined),
      );
  }

  private getFilterBookmarkData$() {
    return combineLatest([
      this.store$.select(selectFilterState),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([ , loadStatus ]) => loadStatus === LoadingStateEnum.LOADED),
      takeUntil(this.destroyed),
      debounceTime(250),
      map(([filterState]) => FilterBookmarkHelper.fragmentFromFilterState(filterState)),
    );
  }

  private deepEqualsVisibilityBookmark(
    bookmark1: LayerVisibilityBookmarkFragment | undefined,
    bookmark2: LayerVisibilityBookmarkFragment | undefined,
  ): boolean {
    if (bookmark1 === bookmark2) {
      return true;
    }
    if (!bookmark1 || !bookmark2 || bookmark1.length !== bookmark2.length) {
      return false;
    }
    return bookmark1.every((item1, index) => {
      const item2 = bookmark2[index];
      return item1.id === item2.id && item1.v === item2.v && item1.o === item2.o;
    });
  }

  private deepEqualsOrderBookmark(
    bookmark1: LayerTreeOrderBookmarkFragment | undefined,
    bookmark2: LayerTreeOrderBookmarkFragment | undefined,
  ): boolean {
    if (bookmark1 === bookmark2) {
      return true;
    }
    if (!bookmark1 || !bookmark2 || bookmark1.length !== bookmark2.length) {
      return false;
    }
    return bookmark1.every((item1, index) => {
      const item2 = bookmark2[index];
      if (item1.id !== item2.id || item1.c.length !== item2.c.length) {
        return false;
      }
      return item1.c.every((child, childIndex) => child === item2.c[childIndex]);
    });
  }

}
