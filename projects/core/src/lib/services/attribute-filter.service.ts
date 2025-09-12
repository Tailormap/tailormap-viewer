import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import {
  AttributeFilterModel, ColumnMetadataModel, DescribeAppLayerService, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { selectViewerId } from '../state/core.selectors';
import { FilterTypeHelper } from '../filter/helpers/filter-type.helper';
import { ExtendedFilterGroupModel } from '../filter/models/extended-filter-group.model';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {
  private store$ = inject(Store);
  private describeAppLayerService = inject(DescribeAppLayerService);

  public getAttributeNamesForLayers$(layerIds: string[]): Observable<string[]> {
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId =>
        forkJoin(
          layerIds.map(layerId =>
            this.describeAppLayerService.getDescribeAppLayer$(applicationId, layerId).pipe(
              map(layerDetails => layerDetails?.attributes?.map(attr => attr.name) || []),
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
            alias: attribute.alias,
          })) || []),
        ),
      ),
    );
  }

  public addAttributeAliasesToFilters$(
    filterGroups: ExtendedFilterGroupModel[],
  ): Observable<ExtendedFilterGroupModel[]> {
    return forkJoin(filterGroups.map(filterGroup => {
      if (FilterTypeHelper.isAttributeFilterGroup(filterGroup)) {
        return this.getFeaturesColumnMetadataForLayer$(filterGroup.layerIds[0]).pipe(
          take(1),
          map(columnMetadata => ({
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
          })),
        );
      }
      return of(filterGroup);
    }));
  }

}
