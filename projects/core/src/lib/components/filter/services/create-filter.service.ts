import { inject, Injectable } from '@angular/core';
import { DescribeAppLayerService, LayerDetailsModel } from '@tailormap-viewer/api';
import { SpatialFilterGeometry, SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { nanoid } from 'nanoid';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';
import { forkJoin, map, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreateFilterService {

  private describeAppLayerService = inject(DescribeAppLayerService);

  public createSpatialFilterGroup$(
    geometries: SpatialFilterGeometry[],
    layers: number[],
  ): Observable<FilterGroupModel<SpatialFilterModel>> {
    return this.getLayerDetailsAndCreateFilter$(layers, geometries);
  }

  public updateSpatialFilterGroup$(
    group: FilterGroupModel<SpatialFilterModel>,
    geometries: SpatialFilterGeometry[],
    layers: number[],
  ): Observable<FilterGroupModel> {
    if (!group || group.filters.length === 0) {
      return this.createSpatialFilterGroup$(geometries, layers);
    }
    return this.getLayerDetailsAndCreateFilter$(layers, geometries)
      .pipe(
        map(filterGroup => {
          return {
            ...group,
            layerIds: layers,
            filters: filterGroup.filters,
          };
        }),
      );
  }

  private getLayerDetailsAndCreateFilter$(layers: number[], geometries: SpatialFilterGeometry[]): Observable<FilterGroupModel<SpatialFilterModel>> {
    const layers$ = layers.map(layer => this.describeAppLayerService.getDescribeAppLayer$(1, layer));
    return forkJoin(layers$)
      .pipe(
        take(1),
        map(layerDetails => {
          return this.createFilterForLayers(layerDetails, geometries);
        }),
      );
  }

  private createFilterForLayers(layers: LayerDetailsModel[], geometries: SpatialFilterGeometry[]): FilterGroupModel<SpatialFilterModel> {
    const filter: SpatialFilterModel = {
      id: nanoid(),
      type: FilterTypeEnum.SPATIAL,
      geometries,
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
