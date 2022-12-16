import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LayerModel, LayerTypesEnum, MapService, OgcHelper, WMSLayerModel, WMTSLayerModel } from '@tailormap-viewer/map';
import { combineLatest, concatMap, distinctUntilChanged, filter, forkJoin, map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ResolvedServerType, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { selectMapOptions, selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersWithServices } from '../state/map.selectors';
import { ExtendedAppLayerModel } from '../models';
import { selectCQLFilters } from '../../filter/state/filter.selectors';

@Injectable({
   providedIn: 'root',
})
export class ApplicationMapService implements OnDestroy {

  private destroyed = new Subject();
  private capabilities: Map<number, string> = new Map();

  constructor(
    private store$: Store,
    private mapService: MapService,
    private httpClient: HttpClient,
  ) {
    const isValidLayer = (layer: LayerModel | null): layer is LayerModel => layer !== null;
    this.store$.select(selectMapOptions)
      .pipe(
        takeUntil(this.destroyed),
        filter(mapOptions => !!mapOptions),
        distinctUntilChanged((prev, curr) => {
          if (prev === null || curr === null) {
            return false;
          }
          return prev.projection === curr.projection &&
            ArrayHelper.arrayEquals(prev.initialExtent, curr.initialExtent) &&
            ArrayHelper.arrayEquals(prev.maxExtent, curr.maxExtent);
        }),
      )
      .subscribe(mapOptions => {
        if (mapOptions === null) {
          return;
        }
        this.mapService.initMap(mapOptions);
      });

    this.store$.select(selectOrderedVisibleBackgroundLayers)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(layers => this.getLayersAndLayerManager$(layers)),
      )
      .subscribe(([ layers, layerManager ]) => {
        layerManager.setBackgroundLayers(layers.filter(isValidLayer));
      });

    this.selectOrderedVisibleLayersWithFilters$()
      .pipe(
        takeUntil(this.destroyed),
        concatMap(layers => this.getLayersAndLayerManager$(layers)),
      )
      .subscribe(([ layers, layerManager ]) => {
        layerManager.setLayers(layers.filter(isValidLayer));
      });
  }

  public selectOrderedVisibleLayersWithFilters$() {
    return combineLatest([
      this.store$.select(selectOrderedVisibleLayersWithServices),
      this.store$.select(selectCQLFilters),
    ]).pipe(
      map(([ layers, filters ]) => {
        return layers.map(l => ({ ...l, filter: filters.get(l.id) }));
      }),
    );
  }

  private getLayersAndLayerManager$(serviceLayers: ExtendedAppLayerModel[]) {
    const layers$ = serviceLayers
      .map(layer => this.convertAppLayerToMapLayer$(layer));
    return forkJoin([
      layers$.length > 0 ? forkJoin(layers$) : of([]),
      this.mapService.getLayerManager$().pipe(take(1)),
    ]);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public convertAppLayerToMapLayer$(extendedAppLayer: ExtendedAppLayerModel): Observable<LayerModel | null> {
    if (!extendedAppLayer.service) {
      return of(null);
    }
    const service = extendedAppLayer.service;
    if (service.protocol === ServiceProtocol.TILED) {
      return this.getCapabilitiesForWMTS$(service)
        .pipe(
          map((capabilities: string): WMTSLayerModel => ({
            id: `${extendedAppLayer.id}`,
            layers: extendedAppLayer.layerName,
            name: extendedAppLayer.layerName,
            layerType: LayerTypesEnum.WMTS,
            visible: extendedAppLayer.visible,
            url: extendedAppLayer.url || service.url,
            crossOrigin: 'anonymous',
            capabilities: capabilities || '',
            hiDpiMode: extendedAppLayer.hiDpiMode,
            hiDpiSubstituteLayer: extendedAppLayer.hiDpiSubstituteLayer,
            opacity: extendedAppLayer.opacity,
          })),
        );
    }
    if (service.protocol === ServiceProtocol.WMS) {
      const layer: WMSLayerModel = {
        id: `${extendedAppLayer.id}`,
        layers: extendedAppLayer.layerName,
        name: extendedAppLayer.layerName,
        layerType: LayerTypesEnum.WMS,
        visible: extendedAppLayer.visible,
        url: extendedAppLayer.url || service.url,
        crossOrigin: 'anonymous',
        serverType: service.serverType,
        resolvedServerType: service.resolvedServerType as ResolvedServerType,
        tilingDisabled: service.tilingDisabled,
        tilingGutter: service.tilingGutter,
        filter: extendedAppLayer.filter,
        opacity: extendedAppLayer.opacity,
      };
      return of(layer);
    }
    return of(null);
  }

  private getCapabilitiesForWMTS$(service: ServiceModel): Observable<string> {
    if (service.capabilities) {
      return of(service.capabilities);
    }
    const cachedCapabilities = this.capabilities.get(service.id);
    if (cachedCapabilities) {
      return of(cachedCapabilities);
    }
    return this.httpClient.get(OgcHelper.filterOgcUrlParameters(service.url), {
      responseType: 'text',
      params: new HttpParams().append('REQUEST', 'GetCapabilities').append('SERVICE', 'WMTS'),
    }).pipe(
      tap(capabilities => this.capabilities.set(service.id, capabilities)),
    );
  }

}
