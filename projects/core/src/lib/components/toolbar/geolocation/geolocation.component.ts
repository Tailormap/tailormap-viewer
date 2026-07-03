import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CoordinateHelper, MapService } from '@tailormap-viewer/map';
import { Subject, take } from 'rxjs';
import { BaseComponentTypeEnum, FeatureModel, GeolocationConfigModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-geolocation',
  templateUrl: './geolocation.component.html',
  styleUrls: ['./geolocation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GeolocationComponent implements OnInit {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private snackBar = inject(MatSnackBar);

  private destroyRef = inject(DestroyRef);
  private featureGeom = new Subject<FeatureModel[]>();

  private activeWatch: number | undefined = undefined;
  private activeWatchTimeout = -1;

  private static GEOLOCATION_TIMEOUT_MS = 12 * 1000;
  private static MAX_ZOOM_EPSG_28992 = 19;
  private static MAX_ZOOM_DEFAULT = 18;

  public hasGeolocation = navigator.geolocation !== undefined;
  public isWatching = signal(false);
  public isFollowing = signal(false);
  public hasFix = signal(false);
  private noTimeout = signal(false);

  constructor() {
    const store$ = this.store$;

    ComponentConfigHelper.useInitialConfigForComponent<GeolocationConfigModel>(
      store$,
      BaseComponentTypeEnum.GEOLOCATION,
      config => {
        this.noTimeout.set(config.noTimeout ?? false);
      },
    );
  }

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
     }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.mapService.getPointerDrag$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.isFollowing()) {
        this.isFollowing.set(false);
        this.showSnackbarMessage($localize `:@@core.toolbar.zoom-following-canceled:Stopped following location`, 2000);
      }
    });
  }

  private positionSuccess(pos: GeolocationPosition) {
    this.mapService.getProjectionCode$()
      .pipe(take(1))
      .subscribe(projectionCode => {
          const location = CoordinateHelper.projectCoordinates([ pos.coords.longitude, pos.coords.latitude ], 'EPSG:4326', projectionCode);

          const pointWkt = `POINT(${location[0]} ${location[1]})`;
          const circleWkt = CoordinateHelper.circleFromWGS84CoordinatesAndRadius([ pos.coords.longitude, pos.coords.latitude ], pos.coords.accuracy, projectionCode);

          this.featureGeom.next([
            { __fid: 'geolocation-point', geometry: pointWkt, attributes: {} },
            { __fid: 'geolocation-shadow', geometry: circleWkt, attributes: {} },
          ]);

          if (!this.hasFix() || this.isFollowing()) {
            this.hasFix.set(true);
            const maxZoom = projectionCode === 'EPSG:28992'
              ? GeolocationComponent.MAX_ZOOM_EPSG_28992
              : GeolocationComponent.MAX_ZOOM_DEFAULT;

            if (this.isFollowing()) {
              this.mapService.zoomToXY(location, undefined, 500);
            } else {
              this.mapService.zoomTo(circleWkt, projectionCode, maxZoom);
            }

            if (!this.isFollowing() && !this.noTimeout()) {
              this.activeWatchTimeout = window.setTimeout(() => this.cancelGeolocation(), GeolocationComponent.GEOLOCATION_TIMEOUT_MS);
            }
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
      this.isWatching.set(false);
      this.isFollowing.set(false);
      this.hasFix.set(false);
  }

  private showSnackbarMessage(msg: string, duration?: number) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: duration || 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  private positionError(e: GeolocationPositionError) {
      switch (e.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          this.showSnackbarMessage($localize `:@@core.toolbar.zoom-to-location-failed-permission-denied:Fetching location failed: permission denied`);
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          // eslint-disable-next-line max-len
          this.showSnackbarMessage($localize `:@@core.toolbar.zoom-to-location-failed-location-unavailable:Fetching location failed: location unavailable`);
          break;
        case GeolocationPositionError.TIMEOUT:
          this.showSnackbarMessage($localize `:@@core.toolbar.zoom-to-location-failed-timeout:Fetching location failed: timeout`);
          break;
      }
      this.cancelGeolocation();
  }

  public onClick(): void {
    if (this.activeWatch === undefined) {
      this.activeWatch = navigator.geolocation.watchPosition(this.positionSuccess.bind(this), this.positionError.bind(this), { enableHighAccuracy: true });
      this.isWatching.set(true);
    } else {
      if (this.hasFix() && !this.isFollowing()) {
        this.isFollowing.set(true);
        clearTimeout(this.activeWatchTimeout);
      } else {
        this.cancelGeolocation();
      }
    }
  }

  public getTooltip() {
    if (this.isFollowing()) {
      return $localize `:@@core.toolbar.zoom-to-location-following:Following location`;
    }
    if (this.activeWatch) {
      if (!this.hasFix()) {
        return $localize`:@@core.toolbar.zoom-to-location-waiting:Waiting for location fix`;
      } else {
        return $localize `:@@core.toolbar.zoomed-to-location:Location found (click to follow)`;
      }
    }
    return $localize `:@@core.toolbar.zoom-to-location:Zoom to location`;
  }
}
