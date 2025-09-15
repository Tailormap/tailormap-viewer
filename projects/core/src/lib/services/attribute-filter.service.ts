import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import {
  AttributeFilterModel, DescribeAppLayerService, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { selectViewerId } from '../state/core.selectors';
import { updateFilterGroup } from '../filter/state/filter.actions';
import { selectVisibleLayersWithServices } from '../map/state/map.selectors';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {
  private store$ = inject(Store);
  private describeAppLayerService = inject(DescribeAppLayerService);


  public getAttributeNamesForLayers$(layerIds: string[]): Observable<string[]> {
    // Get the attribute names that are in all layers
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId =>
        forkJoin(
          layerIds.map(layerId => {
              return this.describeAppLayerService.getDescribeAppLayer$(applicationId, layerId).pipe(
                map(layerDetails => layerDetails?.attributes?.map(attr => attr.name) || []),
              );
            },
          ),
        ),
      ),
      map(attributeArrays => {
        if (attributeArrays.length === 0) {
          return [];
        }
        return attributeArrays.reduce((acc, curr) => acc.filter(attr => curr.includes(attr)));
      }),
    );
  }

  public disableFiltersForMissingAttributes$(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ) {
    this.store$.select(selectVisibleLayersWithServices)
      .pipe(
        // takeUntil(uncheckedLayersSubject$.pipe(first(layers => layers.length === 0))),
        switchMap(visibleLayers => {
          const visibleLayerIds = visibleLayers.map(layer => layer.id);
          return forkJoin(
            filterGroups.map(group => {
              if (group.type === FilterTypeEnum.ATTRIBUTE && group.layerIds.some(layerId => visibleLayerIds.includes(layerId))) {
                return this.getAttributeNamesForLayers$(group.layerIds.filter(layerId => visibleLayerIds.includes(layerId))).pipe(
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
        }),
      ).subscribe(groups => {
        for (const group of groups) {
          this.store$.dispatch(updateFilterGroup({ filterGroup: group }));
        }
    });
  }

  public separateSubstringFiltersInCheckboxFilters(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ): FilterGroupModel<AttributeFilterModel>[] {
    return filterGroups.map(group => {
      if (group.type === FilterTypeEnum.ATTRIBUTE) {
        const allSubstringFilters: AttributeFilterModel[] = group.filters.map(filter => {
          const substringFilters: AttributeFilterModel[] = [];
          if (filter.editConfiguration?.filterTool === FilterToolEnum.CHECKBOX) {
            substringFilters.push(...filter.editConfiguration.attributeValuesSettings
              .filter(value => value.useAsIlikeSubstringFilter)
              .map(value => ({
                attribute: filter.attribute,
                attributeType: filter.attributeType,
                caseSensitive: filter.caseSensitive,
                condition: FilterConditionEnum.STRING_LIKE_KEY,
                invertCondition: filter.invertCondition,
                disabled: !value.initiallySelected,
                value: [value.value],
                type: filter.type,
                id: `${filter.id}-substring-${value.value}`,
                generatedByFilterId: filter.id,
              })));
          }
          return substringFilters;
        }).flat();
        return {
          ...group,
          filters: group.filters.concat(allSubstringFilters),
        };
      }
      return group;
    });

  }

}
