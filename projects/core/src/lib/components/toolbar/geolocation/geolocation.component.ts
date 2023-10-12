import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MapService, CoordinateHelper } from '@tailormap-viewer/map';
import { Subject, takeUntil, take } from 'rxjs';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'tm-geolocation',
  templateUrl: './geolocation.component.html',
  styleUrls: ['./geolocation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeolocationComponent implements OnInit, OnDestroy {
  private destroyed = new Subject();
  private featureGeom = new Subject<FeatureModel[]>();

  private activeWatch: number | undefined = undefined;
  private activeWatchTimeout = -1;

  private static GEOLOCATION_TIMEOUT_MS = 12 * 1000;

  public hasGeolocation = navigator.geolocation !== undefined;
  public isWatching = false;
  public hasFix = false;

  constructor(
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.mapService.renderFeatures$('geolocation-layer', this.featureGeom.asObservable(), f => {
      const primaryColor = ApplicationStyleService.getPrimaryColor();

      if (f.__fid === 'geolocation-point') {
        return {
          styleKey: 'geolocation-point-style',
          zIndex: 1000,
          pointType: 'circle',
          pointSize: 7,
          pointFillColor: primaryColor,
          pointStrokeColor: '#ffffff',
          pointStrokeWidth: 2,
        };
      } else {
        return {
          styleKey: 'geolocation-shadow-style',
          zIndex: 999,
          fillColor: primaryColor,
          fillOpacity: 20,
          strokeColor: primaryColor,
          strokeOpacity: 40,
        };
      }
     }).pipe(takeUntil(this.destroyed)).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private positionSuccess(pos: GeolocationPosition) {
    this.mapService.getProjectionCode$()
      .pipe(take(1))
      .subscribe(projectionCode => {
          const point = CoordinateHelper.projectCoordinates([ pos.coords.longitude, pos.coords.latitude ], 'EPSG:4326', projectionCode);
          if (point === undefined) {
              return;
          }

          const pointWkt = `POINT(${point[0]} ${point[1]})`;
          const circleWkt = CoordinateHelper.circleFromWGS84CoordinatesAndRadius([ pos.coords.longitude, pos.coords.latitude ], pos.coords.accuracy, projectionCode);

          this.featureGeom.next([
            { __fid: 'geolocation-point', geometry: pointWkt, attributes: {} },
            { __fid: 'geolocation-shadow', geometry: circleWkt, attributes: {} },
          ]);

          if (!this.hasFix) {
            this.hasFix = true;
            this.mapService.zoomTo(circleWkt, projectionCode);
            this.activeWatchTimeout = window.setTimeout(() => this.cancelGeolocation(), GeolocationComponent.GEOLOCATION_TIMEOUT_MS);
            this.cdr.detectChanges();
          }
      });
  }

  private cancelGeolocation() {
      if (this.activeWatch !== undefined) {
        navigator.geolocation.clearWatch(this.activeWatch);
        this.activeWatch = undefined;

        clearTimeout(this.activeWatchTimeout);
      }

      this.featureGeom.next([]);
      this.isWatching = false;
      this.hasFix = false;
      this.cdr.detectChanges();
  }

  private positionError(e: GeolocationPositionError) {
      switch (e.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          this.snackBar.open($localize `:@@core.toolbar.zoom-to-location-failed-permission-denied:Fetching location failed: permission denied`, undefined, { duration: 5000 });
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          // eslint-disable-next-line max-len
          this.snackBar.open($localize `:@@core.toolbar.zoom-to-location-failed-location-unavailable:Fetching location failed: location unavailable`, undefined, { duration: 5000 });
          break;
        case GeolocationPositionError.TIMEOUT:
          this.snackBar.open($localize `:@@core.toolbar.zoom-to-location-failed-timeout:Fetching location failed: timeout`, undefined, { duration: 5000 });
          break;
      }
      this.cancelGeolocation();
  }

  public onClick(): void {
    if (this.activeWatch === undefined) {
      this.activeWatch = navigator.geolocation.watchPosition(this.positionSuccess.bind(this), this.positionError.bind(this), { enableHighAccuracy: true });
      this.isWatching = true;
      this.cdr.detectChanges();
    } else {
      this.cancelGeolocation();
    }
  }

}
