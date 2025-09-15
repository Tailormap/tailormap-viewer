import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, of, switchMap, take, takeUntil, first, BehaviorSubject, tap } from 'rxjs';
import {
  AttributeFilterModel, DescribeAppLayerService, FilterConditionEnum, FilterGroupModel, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { selectViewerId } from '../state/core.selectors';
import { selectFilterGroups } from '../filter/state/filter.selectors';
import { withLatestFrom } from 'rxjs/operators';
import { updateFilterGroup } from '../filter/state/filter.actions';
import { selectVisibleLayersWithServices } from '../map/state/map.selectors';

@Injectable({
  providedIn: 'root',
})
export class AttributeFilterService {
  private store$ = inject(Store);
  private describeAppLayerService = inject(DescribeAppLayerService);


  public getAttributeNamesForLayers$(layerIds: string[]): Observable<string[]> {
    // Get only the attribute names that common to all layers
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

  public disableFiltersForMissingAttributes$(
    filterGroups: FilterGroupModel<AttributeFilterModel>[],
  ): Observable<FilterGroupModel<AttributeFilterModel>[]> {
    return this.store$.select(selectVisibleLayersWithServices)
      .pipe(
        take(1),
        tap(visibleLayers => {
          const visibleLayerIds = visibleLayers.map(layer => layer.id);
          const uncheckedLayerIds = filterGroups
            .map(g => g.layerIds).flat().filter(id => !visibleLayerIds.includes(id));
          this.checkLayersOnVisible(uncheckedLayerIds);
        }),
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
      );
  }

  private checkLayersOnVisible(uncheckedLayerIds: string[]) {
    const newUncheckedLayersSubject$ = new BehaviorSubject<string[]>(uncheckedLayerIds);
    const uncheckedLayersSubject$ = new BehaviorSubject<string[]>(uncheckedLayerIds);

    this.store$.select(selectVisibleLayersWithServices)
      .pipe(
        withLatestFrom(uncheckedLayersSubject$, this.store$.select(selectFilterGroups)),
        takeUntil(uncheckedLayersSubject$.pipe(first(layers => layers.length === 0))),
        switchMap(([ visibleLayers, uncheckedLayers, filterGroups ]) => {
          const newVisibleLayerIds = visibleLayers.map(layer => layer.id).filter(id => uncheckedLayers.includes(id));
          if (newVisibleLayerIds.length === 0) {
            return of(null);
          }
          const affectedFilterGroups = filterGroups.filter(group =>
            group.layerIds.some(layerId => newVisibleLayerIds.includes(layerId)));
          const remainingUncheckedLayers = uncheckedLayers.filter(id => !newVisibleLayerIds.includes(id));
          newUncheckedLayersSubject$.next(remainingUncheckedLayers);
          return forkJoin(
            affectedFilterGroups.map(group => {
              if (group.type === FilterTypeEnum.ATTRIBUTE) {
                return this.getAttributeNamesForLayers$(group.layerIds.filter(layerId => newVisibleLayerIds.includes(layerId))).pipe(
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
      )
      .subscribe(affectedGroups => {
        if (affectedGroups) {
          for (const group of affectedGroups) {
            this.store$.dispatch(updateFilterGroup({ filterGroup: group }));
          }
        }
        uncheckedLayersSubject$.next(newUncheckedLayersSubject$.getValue());
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
