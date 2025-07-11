import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { AttributeFilterModel, DescribeAppLayerService, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { Injectable } from '@angular/core';
import { selectViewerId } from '../state/core.selectors';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {

  constructor(
    private store$: Store,
    private describeAppLayerService: DescribeAppLayerService,
  ) { }

  public getAttributeNamesForLayers$(layerIds: string[]): Observable<string[]> {
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId =>
        forkJoin(
          layerIds.map(layerId =>
            this.describeAppLayerService.getDescribeAppLayer$(applicationId, layerId).pipe(
              map(layerDetails => layerDetails?.attributes?.map(attr => attr.key) || []),
            ),
          ),
        ),
      ),
      map(attributeArrays => Array.from(new Set(attributeArrays.flat()))),
    );
  }

  public disableFiltersForMissingAttributes$(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ): Observable<FilterGroupModel<AttributeFilterModel>[]> {
    return forkJoin(
      filterGroups.map(group => {
        if (group.type === FilterTypeEnum.ATTRIBUTE) {
          return this.getAttributeNamesForLayers$(group.layerIds).pipe(
            take(1),
            map(attributeNames => ({
              ...group,
              filters: group.filters.map(filter => {
                return {
                  ...filter,
                  disabled: filter.disabled || !attributeNames.includes((filter as AttributeFilterModel).attribute),
                  attributeNotFound: !attributeNames.includes((filter as AttributeFilterModel).attribute),
                };
              }),
            })),
          );
        }
        return of(group);
      }),
    );
  }

}
