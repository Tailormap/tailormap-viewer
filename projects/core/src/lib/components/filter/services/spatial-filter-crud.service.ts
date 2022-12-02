import { inject, Injectable } from '@angular/core';
import { DescribeAppLayerService, LayerDetailsModel } from '@tailormap-viewer/api';
import { SpatialFilterGeometry, SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { nanoid } from 'nanoid';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';
import { concatMap, forkJoin, map, Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectApplicationId } from '../../../state/core.selectors';

@Injectable({
  providedIn: 'root',
})
export class SpatialFilterCrudService {

  private describeAppLayerService = inject(DescribeAppLayerService);
  private store$ = inject(Store);

  public createSpatialFilterGroup$(
    geometries: SpatialFilterGeometry[],
    layers: number[],
    referenceLayer?: number,
  ): Observable<FilterGroupModel<SpatialFilterModel>> {
    return this.getLayerDetails$(layers).pipe(
      map(layerDetails => {
        return this.createFilterForLayers(layerDetails, geometries, referenceLayer);
      }),
    );
  }

  public addGeometry(
    group: FilterGroupModel<SpatialFilterModel>,
    geometry: SpatialFilterGeometry,
  ): FilterGroupModel {
    return {
      ...group,
      filters: group.filters.map(filter => ({ ...filter, geometries: [ ...filter.geometries, geometry ] })),
    };
  }

  public removeGeometry(
    group: FilterGroupModel<SpatialFilterModel>,
    id: string,
  ): FilterGroupModel {
    return {
      ...group,
      filters: group.filters.map(filter => ({ ...filter, geometries: filter.geometries.filter(g => g.id !== id) })),
    };
  }

  public updateBuffer(
    group: FilterGroupModel<SpatialFilterModel>,
    buffer: number | undefined,
  ): FilterGroupModel {
    return { ...group, filters: group.filters.map(f => ({ ...f, buffer })) };
  }

  public updateReferenceLayer(
    group: FilterGroupModel<SpatialFilterModel>,
    layer: number | undefined,
  ): FilterGroupModel {
    return { ...group, filters: group.filters.map(f => ({ ...f, baseLayerId: layer })) };
  }

  public updateLayers$(
    group: FilterGroupModel<SpatialFilterModel>,
    layers: number[],
  ): Observable<FilterGroupModel> {
    return this.getLayerDetails$(layers).pipe(
      map(layerDetails => {
        return {
          ...group,
          layerIds: layerDetails.map(layer => layer.id),
          filters: group.filters.map(filter => {
            return {
              ...filter,
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

  private getLayerDetails$(
    layers: number[],
  ): Observable<LayerDetailsModel[]> {
    return this.store$.select(selectApplicationId).pipe(
      concatMap(applicationId =>
        forkJoin(layers.map(layer => this.describeAppLayerService.getDescribeAppLayer$(applicationId as number, layer))),
      ),
      take(1),
    );
  }

  private createFilterForLayers(
    layers: LayerDetailsModel[],
    geometries: SpatialFilterGeometry[],
    referenceLayer?: number,
  ): FilterGroupModel<SpatialFilterModel> {
    const filter: SpatialFilterModel = {
      id: nanoid(),
      type: FilterTypeEnum.SPATIAL,
      geometries,
      baseLayerId: referenceLayer,
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
      filters: [filter],
      source: 'SPATIAL_FILTER_FORM',
    };
  }

}
