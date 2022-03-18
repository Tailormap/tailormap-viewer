import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { selectCurrentlySelectedFeatureGeometry, selectFeatureInfoError$ } from '../state/feature-info.selectors';
import { MatSnackBar } from '@angular/material/snack-bar';
import { $localize } from '@angular/localize/init';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private toolConfig: MapClickToolModel = {
    type: ToolTypeEnum.MapClick,
    onClick: evt => this.handleMapClick(evt),
  };

  private static DEFAULT_ERROR_MESSAGE = $localize `Something went wrong while getting feature info, please try again`;
  private static DEFAULT_NO_FEATURES_FOUND_MESSAGE = $localize `No features found`;

  constructor(
    private mapService: MapService,
    private store$: Store,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$(this.toolConfig, true)
      .pipe(takeUntil(this.destroyed))
      .subscribe();
    this.mapService.highlightFeatures$(
      'feature-info-highlight-layer',
      this.store$.select(selectCurrentlySelectedFeatureGeometry),
      {
        styleKey: 'feature-info-highlight-style',
        strokeColor: '#6236ff',
        strokeWidth: 5,
        pointType: 'square',
        pointFillColor: '#6236ff',
      })
      .pipe(takeUntil(this.destroyed))
      .subscribe();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    this.store$.dispatch(loadFeatureInfo({ mapCoordinates: evt.mapCoordinates, mouseCoordinates: evt.mouseCoordinates }));
    this.store$.pipe(selectFeatureInfoError$)
      .subscribe(error => {
        if (!error || error.error === 'none') {
          return;
        }
        const config: SnackBarMessageOptionsModel = {
          message: error.error === 'error'
            ? error.errorMessage || FeatureInfoComponent.DEFAULT_ERROR_MESSAGE
            : FeatureInfoComponent.DEFAULT_NO_FEATURES_FOUND_MESSAGE,
          duration: 5000,
          showDuration: true,
          showCloseButton: true,
        };
        SnackBarMessageComponent.open$(this.snackBar, config);
      });
  }

}
