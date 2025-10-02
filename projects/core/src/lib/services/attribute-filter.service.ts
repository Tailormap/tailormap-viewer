import { Store } from '@ngrx/store';
import { first, forkJoin, map, Observable, switchMap, take, withLatestFrom } from 'rxjs';
import {
  AttributeFilterModel, ColumnMetadataModel, DescribeAppLayerService, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { selectViewerId, selectViewerLoadingState } from '../state/core.selectors';
import { addFilterGroup, addLayerIdsToFilterGroup, removeFilter } from '../filter/state/filter.actions';
import { selectVisibleLayersWithServices } from '../map/state/map.selectors';
import { selectAllFilterGroupsInConfig, selectVerifiedCurrentFilterGroups } from '../filter/state/filter.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FilterTypeHelper } from '../filter/helpers/filter-type.helper';
import { ExtendedFilterGroupModel } from '../filter/models/extended-filter-group.model';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {
  private store$ = inject(Store);
  private describeAppLayerService = inject(DescribeAppLayerService);

  public constructor() {
    this.store$.select(selectViewerLoadingState).pipe(
      first(status => status === LoadingStateEnum.LOADED),
    ).subscribe(() => {
      this.validateFilterGroups();
    });
  }

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

  public getLayerIdsToAttributeNamesMap$(layerIds: string[]): Observable<Map<string, string[]>> {
    return forkJoin(
      layerIds.map(layerId =>
        this.getAttributeNamesForLayer$(layerId).pipe(
          take(1),
          map((attributeNames): [string, string[]] => [ layerId, attributeNames ]),
        ),
      ),
    ).pipe(
      map(layerIdsWithListOfAttributeNames => new Map(layerIdsWithListOfAttributeNames)),
    );
  }

  public validateFilterGroups() {
    this.store$.select(selectVisibleLayersWithServices).pipe(
      withLatestFrom(this.store$.select(selectAllFilterGroupsInConfig)),
      switchMap(([ visibleLayers, filterGroups ]) => {
        const visibleLayerIds = visibleLayers.map(layer => layer.id);
        const visibleLayerIdsInGroups = Array.from(
          new Set(
            filterGroups.flatMap(group =>
              group.layerIds.filter(id => visibleLayerIds.includes(id)),
            ),
          ),
        );
        return this.getLayerIdsToAttributeNamesMap$(visibleLayerIdsInGroups).pipe(take(1));
      }),
      withLatestFrom(this.store$.select(selectAllFilterGroupsInConfig), this.store$.select(selectVerifiedCurrentFilterGroups)),
    ).subscribe(([ layerIdsToAttributesMap, allFilterGroups, currentFilterGroups ]) => {
      for (const configuredGroup of allFilterGroups) {
        const currentGroup = currentFilterGroups.find(g => g.id === configuredGroup.id);
        if (currentGroup?.layerIds.length === configuredGroup.layerIds.length) {
          // skip groups that have been validated for all layerIds
          continue;
        }
        const validatedFilterGroup = this.validateFilterGroup(layerIdsToAttributesMap, configuredGroup);
        if (currentGroup) {
          // Remove filters for missing attributes
          const removedFilters = configuredGroup.filters
            .filter(f => !validatedFilterGroup.filters.find(vf => vf.id === f.id));
          for (const filter of removedFilters) {
            this.store$.dispatch(removeFilter({ filterGroupId: currentGroup.id, filterId: filter.id }));
          }
          // Add newly validated layerIds
          const newlyValidatedLayerIds = validatedFilterGroup.layerIds
            .filter(id => !currentGroup.layerIds.includes(id));
          if (newlyValidatedLayerIds.length > 0) {
            this.store$.dispatch(addLayerIdsToFilterGroup({ filterGroupId: currentGroup.id, layerIds: newlyValidatedLayerIds }));
          }
        } else if (validatedFilterGroup.layerIds.length > 0 && validatedFilterGroup.filters.length > 0) {
          // add filter group if not present and has visible layers and valid filters
          this.store$.dispatch(addFilterGroup({ filterGroup: validatedFilterGroup }));
        }
      }
    });
  }

  private validateFilterGroup(
    layerAttributesMap: Map<string, string[]>,
    group: FilterGroupModel<AttributeFilterModel>,
  ): FilterGroupModel<AttributeFilterModel> {
    const activeLayerIds = group.layerIds.filter(id => layerAttributesMap.has(id));
    return {
      ...group,
      layerIds: activeLayerIds,
      filters: group.filters.filter(filter => {
        const attributeExists = activeLayerIds.every(layerId =>
          layerAttributesMap.get(layerId)?.includes(filter.attribute),
        );
        if (!attributeExists) {
          console.error(`Attribute '${filter.attribute}' not found. Filter with id '${filter.id}' hidden.`);
        }
        return attributeExists;
      }),
    };
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

  private getFeaturesColumnMetadataForLayer$(layerId: string): Observable<ColumnMetadataModel[]> {
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId =>
        this.describeAppLayerService.getDescribeAppLayer$(applicationId, layerId).pipe(
          map(layerDetails => layerDetails?.attributes.map(attribute => ({
            name: attribute.name,
            type: attribute.type,
            alias: attribute.alias || undefined,
          })) || []),
        ),
      ),
    );
  }

  public addAttributeAliasesToFilters$(
    filterGroups: ExtendedFilterGroupModel[],
  ): Observable<ExtendedFilterGroupModel[]> {
    // Collect unique layerIds from attribute filter groups
    const layerIds = Array.from(
      new Set(
        filterGroups
          .filter(FilterTypeHelper.isAttributeFilterGroup)
          .map(group =>
            group.layers.filter(layer => layer.visible).map(layer => layer.id)).flat(),
      ),
    );

    return forkJoin(
      layerIds.map(layerId =>
        this.getFeaturesColumnMetadataForLayer$(layerId).pipe(take(1)),
      ),
    ).pipe(
      map(metadataArrays => {
        const metadataMap = new Map<string, ColumnMetadataModel[]>();
        layerIds.forEach((layerId, idx) => {
          metadataMap.set(layerId, metadataArrays[idx]);
        });

        return filterGroups.map(filterGroup => {
          if (FilterTypeHelper.isAttributeFilterGroup(filterGroup)) {
            const columnMetadata = metadataMap
              .get(filterGroup.layerIds.find(layerId => metadataMap.has(layerId)) || filterGroup.layerIds[0]) || [];
            return {
              ...filterGroup,
              filters: filterGroup.filters.map(filter => {
                if (!FilterTypeHelper.isAttributeFilter(filter)) {
                  return filter;
                }
                const column = columnMetadata.find(col => col.name === filter.attribute);
                return {
                  ...filter,
                  attributeAlias: column?.alias,
                };
              }),
            };
          }
          return filterGroup;
        });
      }),
    );
  }

}
