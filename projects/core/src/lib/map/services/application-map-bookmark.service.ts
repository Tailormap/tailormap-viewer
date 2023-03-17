import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, map, Subject, takeUntil, distinctUntilKeyChanged, debounceTime } from 'rxjs';
import { selectLoadStatus, selectLayers, selectLayerTreeNodes } from '../state/map.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  BookmarkProtoFragmentDescriptor, BookmarkFragmentDescriptor, BookmarkStringFragmentDescriptor,
} from '../../bookmark/bookmark.models';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { setLayerVisibility, setLayerOpacity, setLayerTreeNodeChildren } from '../state/map.actions';
import { LayerVisibilityBookmarkFragment, LayerTreeOrderBookmarkFragment } from '../bookmark/bookmark_pb';
import { MapBookmarkHelper } from '../bookmark/bookmark.helper';

@Injectable({
  providedIn: 'root',
})
export class ApplicationMapBookmarkService implements OnDestroy {
  private static LOCATION_BOOKMARK_DESCRIPTOR: BookmarkFragmentDescriptor = new BookmarkStringFragmentDescriptor('');
  private static VISIBILITY_BOOKMARK_DESCRIPTOR: BookmarkProtoFragmentDescriptor<LayerVisibilityBookmarkFragment>
    = new BookmarkProtoFragmentDescriptor('1', LayerVisibilityBookmarkFragment);

  private static ORDERING_BOOKMARK_DESCRIPTOR: BookmarkProtoFragmentDescriptor<LayerTreeOrderBookmarkFragment>
    = new BookmarkProtoFragmentDescriptor<LayerTreeOrderBookmarkFragment>('2', LayerTreeOrderBookmarkFragment);

  private destroyed = new Subject();

  // Set to true once the bookmark has been read out at least once. This
  // is to make sure that, on slower(?) systems, the bookmark is checked
  // before the location of the map is initially written back.
  private bookmarkChecked = false;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private bookmarkService: BookmarkService,
  ) {
    combineLatest([
      this.bookmarkService.registerFragment$(ApplicationMapBookmarkService.VISIBILITY_BOOKMARK_DESCRIPTOR),
      this.store$.select(selectLayers),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      takeUntil(this.destroyed),
      filter(([, , loadStatus]) => loadStatus === LoadingStateEnum.LOADED),
      distinctUntilKeyChanged('0'),
    )
      .subscribe(([fragment, layers]) => {
        const bookmarkContents = MapBookmarkHelper.visibilityDataFromFragment(fragment, layers);
        if (bookmarkContents.visibilityChanges.length > 0) {
          this.store$.dispatch(setLayerVisibility({visibility: bookmarkContents.visibilityChanges}));
        }

        for (const item of bookmarkContents.opacityChanges) {
          this.store$.dispatch(setLayerOpacity(item));
        }
      });

    combineLatest([
      this.bookmarkService.registerFragment$(ApplicationMapBookmarkService.ORDERING_BOOKMARK_DESCRIPTOR),
      this.store$.select(selectLayerTreeNodes),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      takeUntil(this.destroyed),
      filter(([, , loadStatus]) => loadStatus === LoadingStateEnum.LOADED),
      distinctUntilKeyChanged('0'),
    )
      .subscribe(([fragment, layers]) => {
        const nodes = MapBookmarkHelper.layerTreeOrderFromFragment(fragment, layers);

        if (nodes.length > 0) {
          this.store$.dispatch(setLayerTreeNodeChildren({nodes}));
        }
      });

    this.getVisibilityBookmarkData()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationMapBookmarkService.VISIBILITY_BOOKMARK_DESCRIPTOR, bookmark);
      });

    this.getOrderBookmarkData()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe(bookmark => {
        this.bookmarkService.updateFragment(ApplicationMapBookmarkService.ORDERING_BOOKMARK_DESCRIPTOR, bookmark);
      });

    combineLatest([this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$()])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([info, measure]) => {
        const fragment = MapBookmarkHelper.fragmentFromLocationAndZoom(info, measure);
        if (fragment !== undefined && this.bookmarkChecked) {
          this.bookmarkService.updateFragment(ApplicationMapBookmarkService.LOCATION_BOOKMARK_DESCRIPTOR, fragment);
        }
      });

    combineLatest([
      this.bookmarkService.registerFragment$(ApplicationMapBookmarkService.LOCATION_BOOKMARK_DESCRIPTOR),
      this.mapService.getMapViewDetails$(),
      this.mapService.getUnitsOfMeasure$(),
    ])
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(0),
        distinctUntilKeyChanged('0'),
      )
      .subscribe(([descriptor, viewDetails, unitsOfMeasure]) => {
        const centerAndZoom = MapBookmarkHelper.locationAndZoomFromFragment(descriptor, viewDetails, unitsOfMeasure);
        this.bookmarkChecked = true;

        if (centerAndZoom === undefined) {
          return;
        }

        this.mapService.setCenterAndZoom(centerAndZoom[0], centerAndZoom[1]);
      });
  }

  private getVisibilityBookmarkData() {
    return combineLatest([
      this.store$.select(selectLayers),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([, loadStatus]) => loadStatus === LoadingStateEnum.LOADED),
      map(([layers]) => {
        return MapBookmarkHelper.fragmentFromVisibilityData(layers);
      }),
    );
  }

  private getOrderBookmarkData() {
    return combineLatest([
      this.store$.select(selectLayerTreeNodes),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([, loadStatus]) => loadStatus === LoadingStateEnum.LOADED),
      map(([layers]) => {
        return MapBookmarkHelper.fragmentFromLayerTreeOrder(layers);
      }),
    );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }
}
