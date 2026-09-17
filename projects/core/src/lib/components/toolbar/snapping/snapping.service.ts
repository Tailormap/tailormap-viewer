import { DestroyRef, inject, Injectable } from '@angular/core';
import { BaseComponentTypeEnum, SnappingComponentConfigModel } from '@tailormap-viewer/api';
import { LoadGeometriesService } from '../../../services/load-geometries.service';
import { selectComponentsConfigForType, selectCQLFilters, selectViewerId } from '../../../state';
import { BehaviorSubject, combineLatest, concatMap, distinctUntilChanged, forkJoin, map, Observable, of, take, debounceTime, filter } from 'rxjs';
import { FeaturesFilterHelper, LayerFeaturesFilters } from '../../../filter';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapService } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { DataSourceManagerService } from "../../../services";
import { DataSourceLayerModel } from '../../../models';


interface SnappingFeature {
  __fid: string;
  geometry: string;
  layerId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SnappingService {

  public static MAX_SNAPPING_FEATURES = 250;
  private store$ = inject(Store);
  private loadFeaturesService = inject(LoadGeometriesService);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);
  private snackbar = inject(MatSnackBar);
  private dataSourceManagerService = inject(DataSourceManagerService);

  public configuredLayers = new BehaviorSubject<string[]>([]);
  public availableLayers$ = this.dataSourceManagerService.layersWithAttributes$;
  public selectableLayers$ = combineLatest([
    this.configuredLayers.asObservable(),
    this.availableLayers$,
  ]).pipe(map(([ configured, available ]) => {
    console.log('Available layers', configured, available);
    if (!configured || configured.length === 0) {
      return available;
    }
    const configuredLayers = new Set(configured);
    return available.filter(layer => configuredLayers.has(layer.id));
  }));
  public hasSelectableLayers$ = this.selectableLayers$.pipe(map(l => l.length > 0));

  private snappingLayers = new BehaviorSubject<DataSourceLayerModel[]>([]);
  private snappingFeatures = new BehaviorSubject<SnappingFeature[]>([]);
  private geometriesLoaded: Map<string, string> = new Map();
  private isLoadingGeometries = new BehaviorSubject(false);
  public isLoadingGeometries$ = this.isLoadingGeometries.asObservable();

  private snappingActive = new BehaviorSubject(false);
  public snappingActive$ = this.snappingActive.asObservable();

  public snappingLayers$ = this.snappingLayers.asObservable();
  public snappingFeatures$ = this.snappingFeatures.asObservable();
  public snappingGeometries$: Observable<string[]> = combineLatest([
    this.snappingFeatures$,
    this.snappingActive$,
  ]).pipe(
    map(([ features, visible ]) => {
      if (!visible) {
        return [];
      }
      return features.map(f => f.geometry);
    }),
  );

  public mapExtent$ = this.mapService.getMapViewDetails$()
    .pipe(
      map(d => d.extent),
      distinctUntilChanged((prev, cur) => {
        if (prev === null || cur === null) {
          return prev === cur;
        }
        return prev[0] === cur[0] && prev[1] === cur[1] && prev[2] === cur[2] && prev[3] === cur[3];
      }),
      debounceTime(500),
    );

  constructor() {
    this.store$.select(selectComponentsConfigForType<SnappingComponentConfigModel>(BaseComponentTypeEnum.SNAPPING))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => {
        this.configuredLayers.next(config?.config.selectedLayers || []);
      });
    combineLatest([
      this.snappingLayers.asObservable(),
      this.mapExtent$,
      this.store$.select(selectCQLFilters).pipe(distinctUntilChanged((prev, cur) => {
        return prev.size === cur.size && Array.from(prev.entries()).every(([ key, value ]) => cur.get(key) === value);
      })),
      this.store$.select(selectViewerId),
      this.snappingActive$,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(([ _snappingLayers, _mapExtent, _allFilters, _viewerId, snappingActive ]) => snappingActive),
        debounceTime(500),
        concatMap(([ snappingLayers, mapExtent, allFilters, viewerId ]) => {
          if (!viewerId) {
            throw new Error('Viewer ID must be provided to describe a layer');
          }
          const layerDetails = snappingLayers.map(l => {
            return this.dataSourceManagerService.getDescribeLayer$({ applicationId: viewerId, layerId: l.id, layerName: l.layerName })
              .pipe(take(1));
          });
          return forkJoin([
            of(snappingLayers),
            of(mapExtent),
            of(allFilters),
            forkJoin(layerDetails),
          ]);
        }),
      )
      .subscribe(([ snappingLayers, mapExtent, allFilters, describeLayersResponses ]) => {
        this.cleanUpOldGeometries(snappingLayers);
        snappingLayers.forEach(layer => {
          const currentLoadedKey = this.geometriesLoaded.get(layer.id);
          const layerFilter = allFilters.get(layer.id);
          const cqlFilter = FeaturesFilterHelper.getFilter(layerFilter) || '';
          const detail = describeLayersResponses.find(r => r?.id === layer.id);
          const extentFilter = mapExtent !== null
            ? `BBOX(${detail?.geometryAttribute}, ${mapExtent.join(',')})`
            : '';
          const filters = [];
          if (cqlFilter) {
            filters.push(`(${cqlFilter})`);
          }
          if (extentFilter) {
            filters.push(`(${extentFilter})`);
          }
          const combinedFilter = filters.join(' AND ');
          const updateFilter = FeaturesFilterHelper.updateFilter(combinedFilter, layerFilter);
          const loadedKey = `${layer.id}-${combinedFilter}`;
          if (currentLoadedKey !== loadedKey) {
            this.geometriesLoaded.set(layer.id, loadedKey);
            this.loadGeometries(layer, updateFilter);
          }
        });
      });

    this.selectableLayers$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectableLayers => {
        const currentSnappingLayers = this.snappingLayers.value;
        const selectableLayerIds = new Set(selectableLayers.map(l => l.id));
        const newSnappingLayers = currentSnappingLayers.filter(layer => selectableLayerIds.has(layer.id));
        if (newSnappingLayers.length !== currentSnappingLayers.length) {
          this.snappingLayers.next(newSnappingLayers);
          this.cleanUpOldGeometries(newSnappingLayers);
        }
      });
  }

  public toggleLayer(layer: DataSourceLayerModel) {
    const currentLayers = this.snappingLayers.value;
    const idx = currentLayers.findIndex(l => l.id === layer.id);
    let updatedLayers = [];
    if (idx !== -1) {
      updatedLayers = [
        ...currentLayers.slice(0, idx),
        ...currentLayers.slice(idx + 1),
      ];
    } else {
      updatedLayers = [ ...currentLayers, layer ];
    }
    this.snappingLayers.next(updatedLayers);
    this.cleanUpOldGeometries(updatedLayers);
  }

  public isSnappingActive() {
    return this.snappingActive.value;
  }

  public enableSnapping() {
    this.snappingActive.next(true);
  }

  public disableSnapping() {
    this.snappingActive.next(false);
  }

  private loadGeometries(layer: DataSourceLayerModel, filters: LayerFeaturesFilters | null): void {
    this.isLoadingGeometries.next(true);
    this.loadFeaturesService.loadGeometries$(SnappingService.MAX_SNAPPING_FEATURES, layer.id, layer.layerName, filters)
      .pipe(take(1))
      .subscribe(response => {
        this.isLoadingGeometries.next(false);
        if (response.exceededMaxFeatures) {
          const maxFeatures = SnappingService.MAX_SNAPPING_FEATURES;
          const layerTitle = layer.title;
          const message = $localize `:@@core.snapping.max-features-exceeded-warning:There are more than ${maxFeatures} objects \
            available in the ${layerTitle} snapping layer. The maximum is ${maxFeatures}. Apply filters or zoom in to narrow down the \
            selection.`;
          SnackBarMessageComponent.open$(this.snackbar, { message, duration: 5000 });
        }
        const features: SnappingFeature[] = response.features.map(feat => ({
          ...feat,
          layerId: layer.id,
        }));
        const currentFeatures = this.snappingFeatures.value.filter(f => f.layerId !== layer.id);
        this.snappingFeatures.next([ ...currentFeatures, ...features ]);
      });
  }

  private cleanUpOldGeometries(snappingLayers: DataSourceLayerModel[]) {
    const snappingLayerIds = new Set(snappingLayers.map(layer => layer.id));
    if (this.snappingFeatures.value.some(f => !snappingLayerIds.has(f.layerId))) {
      this.snappingFeatures.next(this.snappingFeatures.value.filter(f => snappingLayerIds.has(f.layerId)));
    }
    Array.from(this.geometriesLoaded.keys())
      .filter(key => !snappingLayerIds.has(key))
      .forEach(key => this.geometriesLoaded.delete(key));
  }

}
