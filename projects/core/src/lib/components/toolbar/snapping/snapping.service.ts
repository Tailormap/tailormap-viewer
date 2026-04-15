import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ExtendedAppLayerModel, selectVisibleLayersWithAttributes } from '../../../map';
import {
  BaseComponentTypeEnum, DEFAULT_SNAPPING_TOLERANCE, DescribeAppLayerService, SnappingComponentConfigModel,
} from '@tailormap-viewer/api';
import { LoadGeometriesService } from '../../../services/load-geometries.service';
import { selectComponentsConfigForType, selectCQLFilters, selectViewerId } from '../../../state';
import { BehaviorSubject, combineLatest, concatMap, distinctUntilChanged, forkJoin, map, Observable, of, take, debounceTime, filter } from 'rxjs';
import { FeaturesFilterHelper } from '../../../filter';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapService } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';

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
  private describeLayerService = inject(DescribeAppLayerService);
  private snackbar = inject(MatSnackBar);

  public configuredLayers = new BehaviorSubject<string[]>([]);
  public availableLayers$ = this.store$.select(selectVisibleLayersWithAttributes);
  public selectableLayers$ = combineLatest([
    this.configuredLayers.asObservable(),
    this.availableLayers$,
  ]).pipe(map(([ configured, available ]) => {
    const configuredLayers = new Set(configured);
    return available.filter(layer => configuredLayers.has(layer.id));
  }));
  public hasSelectableLayers$ = this.selectableLayers$.pipe(map(l => l.length > 0));

  private snappingLayers = new BehaviorSubject<ExtendedAppLayerModel[]>([]);
  private snappingFeatures = new BehaviorSubject<SnappingFeature[]>([]);
  private geometriesLoaded: Map<string, string> = new Map();

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
        filter(([ snappingLayers, mapExtent, allFilters, viewerId, snappingActive ]) => snappingActive),
        debounceTime(500),
        concatMap(([ snappingLayers, mapExtent, allFilters, viewerId ]) => {
          const layerDetails = snappingLayers.map(l => this.describeLayerService.getDescribeAppLayer$(viewerId, l.id).pipe(take(1)));
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
          const cqlFilter = FeaturesFilterHelper.getFilter(allFilters.get(layer.id)) || '';
          const detail = describeLayersResponses.find(r => r.id === layer.id);
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
          const loadedKey = `${layer.id}-${combinedFilter}`;
          if (currentLoadedKey !== loadedKey) {
            this.geometriesLoaded.set(layer.id, loadedKey);
            this.loadGeometries(layer, combinedFilter);
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

  public toggleLayer(layer: ExtendedAppLayerModel) {
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

  private loadGeometries(layer: ExtendedAppLayerModel, cqlFilter: string): void {
    this.loadFeaturesService.loadGeometries$(SnappingService.MAX_SNAPPING_FEATURES, layer.id, cqlFilter)
      .pipe(take(1))
      .subscribe(response => {
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

  private cleanUpOldGeometries(snappingLayers: ExtendedAppLayerModel[]) {
    const snappingLayerIds = new Set(snappingLayers.map(layer => layer.id));
    if (this.snappingFeatures.value.some(f => !snappingLayerIds.has(f.layerId))) {
      this.snappingFeatures.next(this.snappingFeatures.value.filter(f => snappingLayerIds.has(f.layerId)));
    }
    Array.from(this.geometriesLoaded.keys())
      .filter(key => !snappingLayerIds.has(key))
      .forEach(key => this.geometriesLoaded.delete(key));
  }

}
