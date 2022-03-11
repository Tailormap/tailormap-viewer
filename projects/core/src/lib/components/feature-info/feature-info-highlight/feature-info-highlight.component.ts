import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { LayerTypesEnum, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { selectCurrentlySelectedFeature } from '../state/feature-info.selectors';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { WKT } from 'ol/format';
import { Fill, Stroke, Style } from 'ol/style';

@Component({
  selector: 'tm-feature-info-highlight',
  templateUrl: './feature-info-highlight.component.html',
  styleUrls: ['./feature-info-highlight.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoHighlightComponent implements OnInit, OnDestroy {

  private vectorLayerStyle = new Style({
    stroke: new Stroke({ color: '#6236ff', width: 5 }),
    fill: new Fill({ color: 'red' }),
  });

  private destroyed = new Subject();

  constructor(
    private mapService: MapService,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
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

}
