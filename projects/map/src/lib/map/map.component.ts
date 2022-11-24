import { AfterViewInit, Component, ElementRef, inject, OnDestroy } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, combineLatest, withLatestFrom, distinctUntilKeyChanged } from 'rxjs';
import { MapSizeHelper } from '../helpers/map-size.helper';

import { setBookmarkData, appliedBookmarkData, selectUnappliedFragment } from '@tailormap-viewer/core';

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

  constructor(
    private el: ElementRef,
    private mapService: MapService,
  ) {
      combineLatest([ this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$() ])
        .pipe(takeUntil(this.destroyed), debounceTime(100), withLatestFrom(this.store$.select(selectUnappliedFragment(0))))
        .subscribe(([[ info, measure ], unapplied ]) => {
            if (unapplied !== undefined || info.center === undefined || info.center === null) {
                return;
            }

            const precision = MapSizeHelper.getCoordinatePrecision(measure);

            const encoded = new Uint8Array(16 + 4 + 4);
            const view = new DataView(encoded.buffer);
            view.setFloat64(0, info.center[0]);
            view.setFloat64(8, info.center[1]);
            view.setFloat32(16, info.zoomLevel);
            view.setUint32(20, precision);

            console.log(info.center, info.zoomLevel, precision);

            this.store$.dispatch(setBookmarkData({ data: { id: 0, value: [...encoded] } }));
        });

    combineLatest([ this.store$.select(selectUnappliedFragment(0)), this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$() ])
      .pipe(takeUntil(this.destroyed), distinctUntilKeyChanged(0))
      .subscribe(([ info, mapView, measure ]) => {
          if (info === undefined) {
              return;
          }

          const encoded = Uint8Array.from(info.value);
          const decoded = new DataView(encoded.buffer);
          const precision = MapSizeHelper.getCoordinatePrecision(measure);
          const epsilon = Math.pow(10, -precision);

          const center = [ decoded.getFloat64(0), decoded.getFloat64(8) ];
          const zoomLevel = decoded.getFloat32(16);

          if (mapView.center !== undefined && mapView.center !== null && Math.abs(center[0] - mapView.center[0]) <= epsilon && Math.abs(center[1] - mapView.center[1]) <= epsilon && Math.abs(zoomLevel - mapView.zoomLevel) < 1) {
              // not applying the bookmark as the difference between where we are now and where the bookmark is is minimal.
              this.store$.dispatch(appliedBookmarkData({ bookmark: info }));
              return;
          }

          this.mapService.setCenterAndZoom(center, zoomLevel);

          this.store$.dispatch(appliedBookmarkData({ bookmark: info }));
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
