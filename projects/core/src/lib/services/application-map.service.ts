import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LayerTypesEnum, MapService, WMSLayerModel } from '@tailormap-viewer/map';
import { selectBaseLayers, selectLayers, selectMapOptions } from '../state/core.selectors';
import { concatMap, filter, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { AppLayerModel, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';

@Injectable({
   providedIn: 'root',
})
export class ApplicationMapService implements OnDestroy {

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private mapService: MapService,
  ) {
    this.store$.select(selectMapOptions)
      .pipe(
        takeUntil(this.destroyed),
        filter(mapOptions => !!mapOptions),
      )
      .subscribe(mapOptions => {
        this.mapService.initMap(mapOptions);
      });

    this.store$.select(selectBaseLayers)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(baseLayers => this.getLayersAndLayerManager$(baseLayers)),
      )
      .subscribe(([ baseLayers, layerManager ]) => {
        if (baseLayers.length === 0) {
          return;
        }
        // @TODO: support more than 1 baseLayer
        layerManager.setBackgroundLayer(baseLayers[0]);
      });

    this.store$.select(selectLayers)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(layers => this.getLayersAndLayerManager$(layers)),
      )
      .subscribe(([ layers, layerManager ]) => {
        layerManager.setLayers(layers);
      });
  }

  private getLayersAndLayerManager$(serviceLayers: Array<{ layer: AppLayerModel; service?: ServiceModel }>) {
    const layers = serviceLayers
      .map(layer => ApplicationMapService.convertAppLayerToMapLayer(layer.layer, layer.service))
      .filter(layer => !!layer);
    return forkJoin([
      of(layers),
      this.mapService.getLayerManager$().pipe(take(1)),
    ]);
  }

  public ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private static convertAppLayerToMapLayer(appLayer: AppLayerModel, service?: ServiceModel) {
    if (!service) {
      return null;
    }
    // For now, support WMS only
    if (service.protocol === ServiceProtocol.WMS) {
      const layer: WMSLayerModel = {
        id: appLayer.id,
        layers: appLayer.displayName,
        name: appLayer.displayName,
        layerType: LayerTypesEnum.WMS,
        visible: appLayer.visible,
        url: service.url,
        crossOrigin: 'anonymous',
      };
      return layer;
    }
    return null;
  }

}
