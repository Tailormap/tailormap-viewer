import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LayerModel, LayerTypesEnum, MapService, OgcHelper, WMSLayerModel, WMTSLayerModel } from '@tailormap-viewer/map';
import { combineLatest, concatMap, distinctUntilChanged, filter, forkJoin, map, Observable, of, Subject, take, takeUntil, tap, distinctUntilKeyChanged, debounceTime } from 'rxjs';
import { ResolvedServerType, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { selectLoadStatus, selectMapOptions, selectOrderedVisibleBackgroundLayers,
  selectOrderedVisibleLayersWithServices, selectLayers } from '../state/map.selectors';
import { ExtendedAppLayerModel } from '../models';
import { selectCQLFilters } from '../../filter/state/filter.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkFragmentStringDescriptor, BookmarkFragmentProtoDescriptor } from '../../bookmark/bookmark.models';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { setLayerVisibility, setLayerOpacity } from '../state/map.actions';
import { LayerVisibilityBookmarkFragment } from '../bookmark/bookmark_pb';
import { MapBookmarkHelper } from '../bookmark/bookmark.helper';

@Injectable({
   providedIn: 'root',
})
export class ApplicationMapService implements OnDestroy {
  private static LOCATION_BOOKMARK_DESCRIPTOR: BookmarkFragmentStringDescriptor = { type: 'string', identifier: '' };
  private static VISIBILITY_BOOKMARK_DESCRIPTOR: BookmarkFragmentProtoDescriptor<LayerVisibilityBookmarkFragment> = {
    type: 'proto',
    proto: LayerVisibilityBookmarkFragment,
    identifier: '1',
  };

  private destroyed = new Subject();
  private capabilities: Map<number, string> = new Map();

  // Set to true once the bookmark has been read out at least once. This
  // is to make sure that, on slower(?) systems, the bookmark is checked
  // before the location of the map is initially written back.
  private bookmarkChecked = false;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private httpClient: HttpClient,
    private bookmarkService: BookmarkService,
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

    combineLatest([
      this.bookmarkService.registerFragment$(ApplicationMapService.VISIBILITY_BOOKMARK_DESCRIPTOR),
      this.store$.select(selectLayers),
      this.store$.select(selectLoadStatus),
    ]).pipe(
        takeUntil(this.destroyed),
        filter(([ ,, loadStatus ]) => loadStatus === LoadingStateEnum.LOADED),
        distinctUntilKeyChanged('0'),
      )
      .subscribe(([ fragment, layers ]) => {
        const bookmarkContents = MapBookmarkHelper.visibilityDataFromFragment(fragment, layers);
        if (bookmarkContents.visibilityChanges.length > 0) {
          this.store$.dispatch(setLayerVisibility({ visibility: bookmarkContents.visibilityChanges }));
        }

        for (const item of bookmarkContents.opacityChanges) {
          this.store$.dispatch(setLayerOpacity(item));
        }
      });

    this.getVisibilityBookmarkData()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe(bookmark => {
          this.bookmarkService.updateFragment(ApplicationMapService.VISIBILITY_BOOKMARK_DESCRIPTOR, bookmark);
      });

    combineLatest([ this.mapService.getMapViewDetails$(), this.mapService.getUnitsOfMeasure$() ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ info, measure ]) => {
        const fragment = MapBookmarkHelper.fragmentFromLocationAndZoom(info, measure);
        if (fragment !== undefined && this.bookmarkChecked) {
          this.bookmarkService.updateFragment(ApplicationMapService.LOCATION_BOOKMARK_DESCRIPTOR, fragment);
        }
      });

    combineLatest([
      this.bookmarkService.registerFragment$(ApplicationMapService.LOCATION_BOOKMARK_DESCRIPTOR),
      this.mapService.getMapViewDetails$(),
      this.mapService.getUnitsOfMeasure$(),
    ])
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(0),
        distinctUntilKeyChanged('0'),
      )
      .subscribe(([ descriptor, viewDetails, unitsOfMeasure ]) => {
        const centerAndZoom = MapBookmarkHelper.locationAndZoomFromFragment(descriptor, viewDetails, unitsOfMeasure);
        this.bookmarkChecked = true;

        if (centerAndZoom === undefined) {
          return;
        }

        this.mapService.setCenterAndZoom(centerAndZoom[0], centerAndZoom[1]);
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

  private getVisibilityBookmarkData() {
    return combineLatest([
      this.store$.select(selectLayers),
      this.store$.select(selectLoadStatus),
    ]).pipe(
      filter(([ , loadStatus ]) => loadStatus === LoadingStateEnum.LOADED),
      map(([layers]) => {
        return MapBookmarkHelper.fragmentFromVisibilityData(layers);
      }),
    );
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
