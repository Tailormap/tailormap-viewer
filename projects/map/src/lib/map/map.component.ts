import { AfterViewInit, Component, ElementRef, inject, OnDestroy } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, combineLatest, withLatestFrom, distinctUntilKeyChanged } from 'rxjs';
import { MapSizeHelper } from '../helpers/map-size.helper';

import { setBookmarkData, appliedBookmarkData, selectUnappliedFragment, PositionAndZoomFragmentType } from '@tailormap-viewer/core';

@Component({
  selector: 'tm-map',
  template: `<div class="map-container"></div>`,
  styles: [`
    :host,
    .map-container {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
  `],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private store$ = inject(Store);
  private destroyed = new Subject();

  private static BOOKMARK_TYPE: PositionAndZoomFragmentType = { type: 'positionandzoom' };

  constructor(
    private el: ElementRef,
    private mapService: MapService,
  ) {
    combineLatest([ this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$() ])
      .pipe(takeUntil(this.destroyed), debounceTime(100), withLatestFrom(this.store$.select(selectUnappliedFragment(0, MapComponent.BOOKMARK_TYPE))))
      .subscribe(([[ info, measure ], unapplied ]) => {
        if (unapplied !== undefined || info.center === undefined || info.center === null) {
          return;
        }

        const precision = MapSizeHelper.getCoordinatePrecision(measure);
        this.store$.dispatch(setBookmarkData({
          data: {
            id: 0, value: {
              ...MapComponent.BOOKMARK_TYPE,
              position: [ info.center[0], info.center[1] ],
              zoom: info.zoomLevel,
              precision,
            },
          },
        }));
      });

    combineLatest([ this.store$.select(selectUnappliedFragment(0, MapComponent.BOOKMARK_TYPE)), this.mapService.getMapViewDetails$() ])
      .pipe(takeUntil(this.destroyed), distinctUntilKeyChanged(0))
      .subscribe(([ info, mapView ]) => {
        if (info === undefined) {
          return;
        }

        const epsilon = Math.pow(10, -info.precision);

        if (
          mapView.center !== undefined &&
          mapView.center !== null &&
          Math.abs(info.position[0] - mapView.center[0]) <= epsilon &&
          Math.abs(info.position[1] - mapView.center[1]) <= epsilon &&
          Math.abs(info.zoom - mapView.zoomLevel) < 0.01
        ) {
          // not applying the bookmark as the difference between where we are now and where the bookmark is is minimal.
          this.store$.dispatch(appliedBookmarkData({ bookmark: { id: 0, value: info } }));
          return;
        }

        this.mapService.setCenterAndZoom(info.position, info.zoom);
        this.store$.dispatch(appliedBookmarkData({ bookmark: { id: 0, value: info } }));
      });
  }

  public ngAfterViewInit() {
    this.mapService.render(this.el.nativeElement.querySelector('.map-container'));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
