import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import {
  AttributeFilterModel, DescribeAppLayerService, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { selectViewerId } from '../state/core.selectors';
import { addFilterGroup, removeFilterGroup, updateFilterGroup } from '../filter/state/filter.actions';
import { selectVisibleLayersWithServices } from '../map/state/map.selectors';
import { withLatestFrom } from 'rxjs/operators';
import { selectFilterGroups } from '../filter/state/filter.selectors';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {
  private store$ = inject(Store);
  private describeAppLayerService = inject(DescribeAppLayerService);


  public getAttributeNamesForLayers$(layerIds: string[]): Observable<string[]> {
    // Get only the attribute names that common to all layers
    if (layerIds.length === 0) {
      return of([]);
    }
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
      map(layerAttributeNames => {
        if (layerAttributeNames.length === 0) {
          return [];
        }
        // return the attribute names of the first layer, filtered with only the attributes that are in all other layers
        const [ firstLayer, ...remainingLayers ] = layerAttributeNames;
        return firstLayer.filter(attribute => remainingLayers.every(otherLayer => otherLayer.includes(attribute)));
      }),
    );
  }

  public disableFiltersForMissingAttributes(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ) {
    // For each filter group, check if the attributes exist in the visible layers,
    // and add visible and validated filter groups to the filterGroups state
    this.store$.select(selectVisibleLayersWithServices)
      .pipe(
        switchMap(visibleLayers => {
          const visibleLayerIds = visibleLayers.map(layer => layer.id);
          return forkJoin(
            filterGroups.map(group => {
              return this.getAttributeNamesForLayers$(group.layerIds.filter(layerId => visibleLayerIds.includes(layerId))).pipe(
                take(1),
                map(attributeNames => ({
                  ...group,
                  layerIds: group.layerIds.filter(layerId => visibleLayerIds.includes(layerId)),
                  filters: group.filters.map(filter => {
                    return {
                      ...filter,
                      disabled: filter.disabled || !attributeNames.includes((filter as AttributeFilterModel).attribute),
                      attributeNotFound: !attributeNames.includes((filter as AttributeFilterModel).attribute),
                    };
                  }),
                })),
              );
            }),
          );
        }),
        withLatestFrom(this.store$.select(selectFilterGroups)),
      ).subscribe(([ groups, visibleGroups ]) => {
        const visibleGroupIds = visibleGroups.map(g => g.id);
        for (const group of groups) {
          if (visibleGroupIds.includes(group.id)) {
            if (group.layerIds.length === 0) {
              // remove filter group if no layers are visible
              this.store$.dispatch(removeFilterGroup({ filterGroupId: group.id }));

            } else if (visibleGroups.find(g => g.id === group.id)?.layerIds.length !== group.layerIds.length) {
              // update filter group if the layerIds have changed
              this.store$.dispatch(updateFilterGroup({ filterGroup: group }));

            }
          } else {
            if (group.layerIds.length > 0) {
              // add filter group if it has visible layers
              this.store$.dispatch(addFilterGroup({ filterGroup: group }));
            }
          }
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
