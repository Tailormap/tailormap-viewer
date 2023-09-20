import { DestroyRef, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ExtentHelper, MapService, MapViewDetailsModel, OpenlayersExtent } from '@tailormap-viewer/map';
import { CssHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ViewerLayoutService {

  private defaultTopHeight = CssHelper.getCssVariableValueNumeric('--map-control-size') + CssHelper.getCssVariableValueNumeric('--body-margin');
  private extraPadding = 10;

  private paddingLeftSubject = new BehaviorSubject<number>(0);
  private paddingRightSubject = new BehaviorSubject<number>(0);
  private paddingTopSubject = new BehaviorSubject<number>(this.defaultTopHeight);
  private paddingBottomSubject = new BehaviorSubject<number>(0);

  constructor(
    private mapService: MapService,
    private destroyRef: DestroyRef,
  ) {
    combineLatest([
      this.paddingTopSubject.asObservable(),
      this.paddingRightSubject.asObservable(),
      this.paddingBottomSubject.asObservable(),
      this.paddingLeftSubject.asObservable(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      // top, right, bottom and left
      .subscribe((padding) => {
        this.mapService.setPadding(padding.map(p => p + this.extraPadding));
      });
  }

  public setLeftPadding(padding: number) {
    this.paddingLeftSubject.next(padding);
  }

  public setRightPadding(padding: number) {
    this.paddingRightSubject.next(padding);
  }

  public setTopPadding(padding: number) {
    this.paddingTopSubject.next(padding);
  }

  public setBottomPadding(padding: number) {
    this.paddingBottomSubject.next(padding);
  }

  /**
   * Add a property to the MapViewDetailsModel from MapService.getMapViewDetails$() with the map extent that is not covered by UI elements.
   */
  public getUIVisibleMapExtent$(): Observable<MapViewDetailsModel & { uiVisibleExtent: OpenlayersExtent | null }> {
    return combineLatest([ this.mapService.getMapViewDetails$(), this.paddingLeftSubject.asObservable() ]).pipe(
      map(([ mapViewDetails, panelWidth ]) => {

        let uiVisibleExtent = null;
        if (mapViewDetails.extent !== null) {
          uiVisibleExtent = mapViewDetails.extent.slice();

          if (panelWidth > 0) {
            // Panel is on left side, reduce bounding box minX by width of panel
            uiVisibleExtent[0] = uiVisibleExtent[0] + (panelWidth * mapViewDetails.resolution);
          }

          const mapControlsTopLeft = document.querySelector('div.map-controls-left:not(.map-controls-left--on-bottom)')?.getBoundingClientRect();
          if (mapControlsTopLeft) {
            uiVisibleExtent[1] = uiVisibleExtent[1] + (mapControlsTopLeft.bottom * mapViewDetails.resolution);
          }

          const zoomButtons = document.querySelector('div.zoom-buttons')?.getBoundingClientRect();
          if (zoomButtons) {
            uiVisibleExtent[2] = uiVisibleExtent[2] - ((window.innerWidth - zoomButtons.left) * mapViewDetails.resolution);
          }

          // Hardcoded bottom margin for scalebar and coordinates, which aren't always visible...
          uiVisibleExtent[3] = uiVisibleExtent[3] - (60 * mapViewDetails.resolution);

          if (ExtentHelper.isEmpty(uiVisibleExtent)) {
            uiVisibleExtent = null;
          }
        }
        return {
          ...mapViewDetails,
          uiVisibleExtent,
        };
      }),
    );
  }

}
