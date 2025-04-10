import { inject, Injectable } from '@angular/core';
import { DescribeAppLayerService, LayerDetailsModel } from '@tailormap-viewer/api';
import { SpatialFilterGeometry, SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { nanoid } from 'nanoid';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';
import { concatMap, forkJoin, map, Observable, take, combineLatest, filter, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../state/core.selectors';
import { setSelectedFilterGroup, setSelectedLayers } from '../state/filter-component.actions';
import { selectSelectedFilterGroup, selectSelectedLayers } from '../state/filter-component.selectors';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { addFilterGroup, updateFilterGroup } from '../../../filter/state/filter.actions';

@Injectable({
  providedIn: 'root',
})
export class SpatialFilterCrudService {

  private describeAppLayerService = inject(DescribeAppLayerService);
  private store$ = inject(Store);

  public updateSelectedLayers(layers: string[]) {
    this.store$.dispatch(setSelectedLayers({ layers }));
    this.updateSelectedGroup(group => this.updateLayers$(group, layers));
  }

  public addGeometry(geometry: SpatialFilterGeometry) {
    this.updateOrCreateGroup(
      [geometry],
      undefined,
      group => of({
        ...group,
        filters: group.filters.map(f => ({ ...f, geometries: [ ...f.geometries, geometry ] })),
      }),
    );
  }

  public updateGeometry(id: string, geometry: string) {
    this.updateSelectedGroup(group => of({
      ...group,
      filters: group.filters.map(f => ({ ...f, geometries: f.geometries.map(g => g.id === id ? { ...g, geometry } : g) })),
    }));
  }

  public removeGeometry(id: string) {
    this.updateSelectedGroup(group => of({
      ...group,
      filters: group.filters.map(f => ({ ...f, geometries: f.geometries.filter(g => g.id !== id) })),
    }));
  }

  public updateBuffer(buffer: number | undefined) {
    this.updateSelectedGroup(group => of({
      ...group,
      filters: group.filters.map(f => ({ ...f, buffer })),
    }));
  }

  public updateReferenceLayer(layer: string | undefined) {
    this.updateOrCreateGroup(
      [],
      layer,
      group => of({
        ...group,
        error: undefined,
        filters: group.filters.map(f => {
          const currentReferenceLayer = f.baseLayerId;
          const geometries = f.geometries.filter(g => {
            if (typeof layer === 'undefined') {
              return typeof g.referenceLayerId === 'undefined';
            }
            if (layer !== currentReferenceLayer) {
              return typeof g.referenceLayerId === 'undefined' || g.referenceLayerId !== currentReferenceLayer;
            }
            return true;
          });
          return {
            ...f,
            geometries,
            baseLayerId: layer,
          };
        }),
      }),
    );
    return ;
  }

  private updateLayers$(
    group: FilterGroupModel<SpatialFilterModel>,
    layers: string[],
  ): Observable<FilterGroupModel> {
    return this.getLayerDetails$(layers).pipe(
      map(layerDetails => {
        if (layerDetails.length === 0) {
          return group;
        }
        return {
          ...group,
          layerIds: layerDetails.map(layer => layer.id),
          filters: group.filters.map(f => {
            return {
              ...f,
              geometryColumns: layerDetails.map(layer => ({
                layerId: layer.id,
                column: [layer.geometryAttribute],
              })),
            };
          }),
        };
      }),
    );
  }

  private getSelectedGroup$(): Observable<FilterGroupModel<SpatialFilterModel>> {
    return this.store$.select(selectSelectedFilterGroup)
      .pipe(
        take(1),
        filter((group): group is FilterGroupModel<SpatialFilterModel> => !!group && FilterTypeHelper.isSpatialFilterGroup(group)),
      );
  }

  private updateOrCreateGroup(
    geometry: SpatialFilterGeometry[],
    referenceLayer: string | undefined,
    updateFn: (group: FilterGroupModel<SpatialFilterModel>) => Observable<FilterGroupModel>,
  ) {
    combineLatest([
      this.store$.select(selectSelectedFilterGroup),
      this.store$.select(selectSelectedLayers),
    ])
      .pipe(
        take(1),
      )
      .subscribe(([ selectedGroup, selectedLayers ]) => {
        if (selectedGroup && !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return;
        }
        if (!selectedGroup) {
          this.createSpatialFilterGroup(geometry, selectedLayers, referenceLayer);
          return;
        }
        this.updateSelectedGroup(updateFn);
      });
  }

  private updateSelectedGroup(updateFn: (group: FilterGroupModel<SpatialFilterModel>) => Observable<FilterGroupModel>) {
    this.getSelectedGroup$()
      .pipe(concatMap(group => updateFn(group)))
      .subscribe(group => this.store$.dispatch(updateFilterGroup({ filterGroup: group })));
  }

  private createSpatialFilterGroup(
    geometries: SpatialFilterGeometry[],
    layers: string[],
    referenceLayer?: string,
  ): void {
    this.getLayerDetails$(layers)
      .pipe(map(layerDetails => {
        if (layerDetails.length === 0) {
          return null;
        }
        return this.createFilterForLayers(layerDetails, geometries, referenceLayer);
      }))
      .subscribe(filterGroup => {
        if (filterGroup === null) {
          return;
        }
        this.store$.dispatch(addFilterGroup({ filterGroup }));
        this.store$.dispatch(setSelectedFilterGroup({ filterGroup }));
      });
  }

  private getLayerDetails$(
    layers: string[],
  ): Observable<LayerDetailsModel[]> {
    if (layers.length === 0) {
      return of([]);
    }
    return this.store$.select(selectViewerId).pipe(
      concatMap(applicationId =>
        forkJoin(layers.map(layer => this.describeAppLayerService.getDescribeAppLayer$(applicationId as string, layer))),
      ),
      take(1),
    );
  }

  private createFilterForLayers(
    layers: LayerDetailsModel[],
    geometries: SpatialFilterGeometry[],
    referenceLayer?: string,
  ): FilterGroupModel<SpatialFilterModel> {
    const spatialFilter: SpatialFilterModel = {
      id: nanoid(),
      type: FilterTypeEnum.SPATIAL,
      geometries,
      baseLayerId: referenceLayer,
      buffer: undefined,
      geometryColumns: layers.map(layer => ({
        layerId: layer.id,
        column: [layer.geometryAttribute],
      })),
    };
    return {
      id: nanoid(),
      type: FilterTypeEnum.SPATIAL,
      layerIds: layers.map(layer => layer.id),
      operator: 'AND',
      filters: [spatialFilter],
      source: 'SPATIAL_FILTER_FORM',
    };
  }
}
