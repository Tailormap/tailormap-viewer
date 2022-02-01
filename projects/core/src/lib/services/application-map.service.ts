import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LayerModel, LayerTypesEnum, MapService, WMSLayerModel, WMTSLayerModel } from '@tailormap-viewer/map';
import { selectBaseLayers, selectLayers, selectMapOptions } from '../state/core.selectors';
import { concatMap, filter, forkJoin, Observable, of, Subject, take, takeUntil } from 'rxjs';
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
    const isValidLayer = (layer: LayerModel | null): layer is LayerModel => layer !== null;
    this.store$.select(selectMapOptions)
      .pipe(
        takeUntil(this.destroyed),
        filter(mapOptions => !!mapOptions),
      )
      .subscribe(mapOptions => {
        if (mapOptions === null) {
          return;
        }
        this.mapService.initMap(mapOptions);
      });

    this.store$.select(selectBaseLayers)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(baseLayers => this.getLayersAndLayerManager$(baseLayers)),
      )
      .subscribe(([ baseLayers, layerManager ]) => {
        const validBaseLayers = baseLayers.filter(isValidLayer);
        if (validBaseLayers.length === 0) {
          return;
        }
        // @TODO: support more than 1 baseLayer
        layerManager.setBackgroundLayer(validBaseLayers[0]);
      });

    this.store$.select(selectLayers)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(layers => this.getLayersAndLayerManager$(layers)),
      )
      .subscribe(([ layers, layerManager ]) => {
        layerManager.setLayers(layers.filter(isValidLayer));
      });
  }

  private getLayersAndLayerManager$(serviceLayers: Array<{ layer: AppLayerModel; service?: ServiceModel }>) {
    const layers = serviceLayers
      .map(layer => {
        return ApplicationMapService.convertAppLayerToMapLayer$(layer.layer, layer.service);
      });
    return forkJoin([
      forkJoin(layers),
      this.mapService.getLayerManager$().pipe(take(1)),
    ]);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private static convertAppLayerToMapLayer$(appLayer: AppLayerModel, service?: ServiceModel): Observable<LayerModel | null> {
    if (!service) {
      return of(null);
    }
    if (service.protocol === ServiceProtocol.TILED) {
      const layer: WMTSLayerModel = {
        id: `${appLayer.id}`,
        layers: appLayer.displayName,
        name: appLayer.displayName,
        layerType: LayerTypesEnum.WMTS,
        visible: appLayer.visible,
        url: service.url,
        crossOrigin: 'anonymous',
        capabilities: service.capabilities || '',
      };
      return of(layer);
    }
    if (service.protocol === ServiceProtocol.WMS) {
      const layer: WMSLayerModel = {
        id: `${appLayer.id}`,
        layers: appLayer.displayName,
        name: appLayer.displayName,
        layerType: LayerTypesEnum.WMS,
        visible: appLayer.visible,
        url: service.url,
        crossOrigin: 'anonymous',
      };
      return of(layer);
    }
    return of(null);
  }

}
