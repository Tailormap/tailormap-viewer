import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, switchMap, take } from 'rxjs';
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


  public getAttributeNamesForLayer$(layerId: string): Observable<string[]> {
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId =>
        this.describeAppLayerService.getDescribeAppLayer$(applicationId, layerId).pipe(
          map(layerDetails => layerDetails?.attributes?.map(attr => attr.name) || []),
        ),
      ),
    );
  }

  public disableFiltersForMissingAttributes(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ) {
    // For each filterGroup, check if the attributes exist in the visible layers,
    // and add visible and validated filterGroups to the filterGroups state
    this.store$.select(selectVisibleLayersWithServices)
      .pipe(
        switchMap(visibleLayers => {
         // get all unique visible layerIds in filterGroups
          const visibleLayerIds = visibleLayers.map(layer => layer.id);
          const layerIds = Array.from(
            new Set(
              filterGroups.flatMap(group =>
                group.layerIds.filter(id => visibleLayerIds.includes(id)),
              ),
            ),
          );
          // get attribute names for all visible layers in filterGroups
          return forkJoin(
            layerIds.map(layerId =>
              this.getAttributeNamesForLayer$(layerId).pipe(
                take(1),
                map((attributeNames): [string, string[]] => [ layerId, attributeNames ]),
              ),
            ),
          ).pipe(
            map(layerIdsWithListOfAttributeNames => new Map(layerIdsWithListOfAttributeNames)),
            // use map of layers with attribute names to filter out invisible layers and disable filters for missing attributes
            map(layerAttributesMap =>
              filterGroups.map((group): FilterGroupModel<AttributeFilterModel> => {
                const validLayerIds = group.layerIds.filter(id => layerAttributesMap.has(id));
                return {
                  ...group,
                  layerIds: validLayerIds,
                  filters: group.filters.map((filter): AttributeFilterModel => {
                    const attributeExists = validLayerIds.every(layerId =>
                      layerAttributesMap.get(layerId)?.includes(filter.attribute),
                    );
                    return {
                      ...filter,
                      disabled: filter.disabled || !attributeExists,
                      attributeNotFound: !attributeExists,
                    };
                  }),
                };
              }),
            ),
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
