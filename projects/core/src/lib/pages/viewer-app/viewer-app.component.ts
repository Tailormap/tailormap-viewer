import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { LayerTypesEnum, MapService, WMSLayerModel } from '@tailormap-viewer/map';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'tm-viewer-app',
  templateUrl: './viewer-app.component.html',
  styleUrls: ['./viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerAppComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.mapService.initMap({
      projection: 'EPSG:28992',
      projectionAliases: ['http://www.opengis.net/gml/srs/epsg.xml#28992'],
      // eslint-disable-next-line max-len
      projectionDefinition: '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs',
      maxExtent: [ -285401, 22598, 595401, 903401 ],
      initialExtent: [ 123180, 445478, 149359, 463194 ],
    });
    const obsLayer: WMSLayerModel = {
      id: 'osm-nb-hq',
      layers: 'osm-nb-hq',
      name: 'Openbasiskaart',
      layerType: LayerTypesEnum.WMS,
      visible: true,
      url: 'https://www.openbasiskaart.nl/mapcache/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
      crossOrigin: 'anonymous',
    };
    this.mapService.getLayerManager$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(layerManager => {
        layerManager.addLayer(obsLayer);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
