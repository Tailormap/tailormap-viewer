import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  LayerModel, LayerTypesEnum, MapService, OgcHelper, ServiceLayerModel, WMSLayerModel, WMTSLayerModel, XyzLayerModel, Tileset3DLayerModel,
} from '@tailormap-viewer/map';
import { combineLatest, concatMap, distinctUntilChanged, filter, forkJoin, map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { selectMapOptions, selectOrderedVisibleBackgroundLayers, selectOrderedVisibleLayersWithServices, select3Dlayers } from '../state/map.selectors';
import { ExtendedAppLayerModel } from '../models';
import { selectCQLFilters } from '../../filter/state/filter.selectors';
import { withLatestFrom } from 'rxjs/operators';
import { BookmarkService } from '../../services/bookmark/bookmark.service';
import { MapBookmarkHelper } from '../../services/application-bookmark/bookmark.helper';
import { ApplicationBookmarkFragments } from '../../services/application-bookmark/application-bookmark-fragments';
import { selectEnable3D } from '../../state/core.selectors';
import { ApplicationLayerRefreshService } from './application-layer-refresh.service';

@Injectable({
   providedIn: 'root',
})
export class ApplicationMapService implements OnDestroy {
  private destroyed = new Subject();
  private capabilities: Map<string, string> = new Map();

  constructor(
    private store$: Store,
    private mapService: MapService,
    private httpClient: HttpClient,
    private bookmarkService: BookmarkService,
    _applicationRefreshService: ApplicationLayerRefreshService,
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
        withLatestFrom(this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.LOCATION_BOOKMARK_DESCRIPTOR)),
      )
      .subscribe(([ mapOptions, locationBookmark ]) => {
        if (mapOptions === null) {
          return;
        }
        const bookmark = MapBookmarkHelper.locationAndZoomFromFragment(locationBookmark);
        const initialOptions = bookmark ? { initialCenter: bookmark[0], initialZoom: bookmark[1] } : undefined;
        this.mapService.initMap(mapOptions, initialOptions);
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

    if (this.store$.select(selectEnable3D)) {
      this.store$.select(select3Dlayers)
        .pipe(
          takeUntil(this.destroyed),
          concatMap(layers => this.get3DLayersAndLayerManager$(layers)),
        )
        .subscribe(([ layers, layerManager ]) => {
          layerManager.addLayers(layers.filter(isValidLayer));
        });
    }
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

  private get3DLayersAndLayerManager$(serviceLayers: ExtendedAppLayerModel[]) {
    const layers$ = serviceLayers
      .map(layer => this.convertAppLayerToMapLayer$(layer));
    return forkJoin([
      layers$.length > 0 ? forkJoin(layers$) : of([]),
      this.mapService.getCesiumLayerManager$().pipe(take(1)),
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
    const defaultLayerProps: ServiceLayerModel = {
      id: `${extendedAppLayer.id}`,
      name: extendedAppLayer.layerName,
      url: extendedAppLayer.url || service.url,
      layerType: LayerTypesEnum.WMS,
      visible: extendedAppLayer.visible,
      // We don't want a 'tainted canvas' for features such as printing. TM requires CORS-enabled or proxied services.
      crossOrigin: 'anonymous',
      opacity: extendedAppLayer.opacity,
      attribution: extendedAppLayer.attribution,
      hiDpiDisabled: extendedAppLayer.hiDpiDisabled,
    };
    if (service.protocol === ServiceProtocol.WMTS) {
      return this.getCapabilitiesForWMTS$(service)
        .pipe(
          map((capabilities: string): WMTSLayerModel => ({
            ...defaultLayerProps,
            layerType: LayerTypesEnum.WMTS,
            layers: extendedAppLayer.layerName,
            capabilities: capabilities || '',
            hiDpiMode: extendedAppLayer.hiDpiMode,
            hiDpiSubstituteLayer: extendedAppLayer.hiDpiSubstituteLayer,
          })),
        );
    }
    if (service.protocol === ServiceProtocol.WMS) {
      const layer: WMSLayerModel = {
        ...defaultLayerProps,
        layerType: LayerTypesEnum.WMS,
        layers: extendedAppLayer.layerName,
        serverType: service.serverType,
        tilingDisabled: extendedAppLayer.tilingDisabled,
        tilingGutter: extendedAppLayer.tilingGutter,
        filter: extendedAppLayer.filter,
      };
      return of(layer);
    }
    if (service.protocol === ServiceProtocol.XYZ) {
      const layer: XyzLayerModel = {
        ...defaultLayerProps,
        layerType: LayerTypesEnum.XYZ,
        hiDpiMode: extendedAppLayer.hiDpiMode,
        hiDpiSubstituteUrl: extendedAppLayer.hiDpiSubstituteLayer,
        minZoom: extendedAppLayer.minZoom,
        maxZoom: extendedAppLayer.maxZoom,
        tileSize: extendedAppLayer.tileSize,
        tileGridExtent: extendedAppLayer.tileGridExtent,
      };
      return of(layer);
    }
    if (service.protocol === ServiceProtocol.TILESET3D) {
      const layer: Tileset3DLayerModel = {
        ...defaultLayerProps,
        layerType: LayerTypesEnum.TILESET3D,
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
