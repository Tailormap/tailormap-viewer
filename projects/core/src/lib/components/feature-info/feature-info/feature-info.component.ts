import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { LayerTypesEnum, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { selectCurrentlySelectedFeature, selectFeatureInfoError$ } from '../state/feature-info.selectors';
import { MatSnackBar } from '@angular/material/snack-bar';
import { $localize } from '@angular/localize/init';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { Stroke, Style } from 'ol/style';
import { combineLatest } from 'rxjs';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { WKT } from 'ol/format';

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

  private vectorLayerStyle = new Style({
    stroke: new Stroke({ color: '#6236ff', width: 2 }),
  });

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
    combineLatest([
      this.mapService.createVectorLayer$({
        id: 'feature-info-layer',
        name: 'Feature info highlight layer',
        layerType: LayerTypesEnum.Vector,
        visible: false,
      }),
      this.store$.select(selectCurrentlySelectedFeature),
    ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ vectorLayer, currentFeature ]) => {
        if (!vectorLayer || !currentFeature) {
          return;
        }
        const geomAttribute = Array.from(currentFeature.columnMetadata.values()).find(c => c.type === FeatureAttributeTypeEnum.GEOMETRY);
        if (!geomAttribute) {
          return;
        }
        const geom = currentFeature.feature.attributes[geomAttribute.key];
        if (!geom) {
          return;
        }
        vectorLayer.setStyle(this.vectorLayerStyle);
        vectorLayer.getSource().getFeatures().forEach(feature => vectorLayer.getSource().removeFeature(feature));
        vectorLayer.getSource().addFeature((new WKT()).readFeature(geom));
        vectorLayer.setVisible(true);
      });
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
