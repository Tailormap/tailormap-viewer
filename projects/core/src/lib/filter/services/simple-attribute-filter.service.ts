import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as FilterActions from '../../state/filter-state/filter.actions';
import { selectEnabledFilterGroups, selectFilterGroupForType } from '../../state/filter-state/filter.selectors';
import { map, Observable, take } from 'rxjs';
import { nanoid } from 'nanoid';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import {  AttributeFilterModel, FilterTypeEnum, FilterGroupModel } from '@tailormap-viewer/api';

@Injectable({
  providedIn: 'root',
})
export class SimpleAttributeFilterService {

  private store$ = inject(Store);

  public setFilter(
    source: string,
    layerId: string,
    filter: Omit<AttributeFilterModel, 'id'>,
  ) {
    this.getGroup$(source, layerId).pipe(take(1)).subscribe(group => {
      if (!group) {
        this.createGroup(source, layerId, filter);
        return;
      }
      const existingFilter = group.filters.find(f => f.attribute === filter.attribute);
      if (!existingFilter) {
        this.createFilter(group.id, filter);
        return;
      }
      this.updateFilter(group.id, {
        ...existingFilter,
        ...filter,
      });
    });
  }

  public hasFilter$(source: string, layerId: string, featureType?: string) {
    return this.getGroup$(source, layerId)
      .pipe(map(group => {
        return !!group && group.filters.length > 0 && (!featureType || group.filters.some(f => f.featureType === featureType));
      }));
  }

  public hasFiltersForMultipleFeatureTypes$(source: string, layerId: string) {
    return this.getGroup$(source, layerId)
      .pipe(map(group => {
        return !!group && new Set(group.filters.map(f => f.featureType)).size > 1;
      }));
  }

  public getFilters$(source: string, layerId: string): Observable<AttributeFilterModel[]> {
    return this.getGroup$(source, layerId)
      .pipe(map(group => {
        return (group?.filters || []).map(f => ({ ...f, disabled: group?.disabled }));
      }));
  }

  public getFiltersExcludingAttribute$(
    source: string,
    layerId: string,
    attribute: string,
    featureType?: string,
  ) {
    return this.store$.select(selectEnabledFilterGroups)
      .pipe(take(1), map(groups => {
        return groups.map(group => {
          if(group.source !== source || !group.layerIds.includes(layerId)) {
            return group;
          }
          return {
            ...group,
            filters: group.filters.filter(f => {
              if (!FilterTypeHelper.isAttributeFilter(f)) {
                return false;
              }
              if (featureType) {
                return f.attribute !== attribute || f.featureType !== featureType;
              }
              return f.attribute !== attribute;
            }),
          };
        });
      }));
  }

  public getFilterForAttribute$(
    source: string,
    layerId: string,
    attribute: string,
    featureType?: string,
  ): Observable<AttributeFilterModel | null> {
    return this.getGroup$(source, layerId)
      .pipe(
        map(group => {
          return group
            ? group.filters.find(f => {
            if (featureType) {
              return f.attribute === attribute && f.featureType === featureType;
            }
            return f.attribute === attribute;
          }) || null
            : null;
        }),
      );
  }

  public removeFilter(
    source: string,
    layerId: string,
    attribute: string,
  ) {
    this.getGroup$(source, layerId).pipe(take(1)).subscribe(group => {
      if (!group) {
        return;
      }
      const existingFilter = group.filters.find(f => f.attribute === attribute);
      if (!existingFilter) {
        return;
      }
      if (group.filters.length === 1) {
        this.store$.dispatch(FilterActions.removeFilterGroup({ filterGroupId: group.id }));
        return;
      }
      this.store$.dispatch(FilterActions.removeFilter({ filterGroupId: group.id, filterId: existingFilter.id }));
    });
  }

  public removeFiltersForLayer(
    source: string,
    layerId: string,
    featureType?: string,
  ) {
    this.getGroup$(source, layerId).pipe(take(1)).subscribe(group => {
      if (!group) {
        return;
      }
      if (featureType) {
        const filtersToKeep = group.filters.filter(f => {
          if (!FilterTypeHelper.isAttributeFilter(f)) {
            return true;
          }
          return f.featureType !== featureType;
        });
        if (filtersToKeep.length > 0) {
          this.store$.dispatch(FilterActions.updateFilterGroup({
            filterGroup: {
              ...group,
              filters: filtersToKeep,
            },
          }));
          return;
        }
      }
      this.store$.dispatch(FilterActions.removeFilterGroup({ filterGroupId: group.id }));
    });
  }

  private createGroup(source: string, layerId: string, filter: Omit<AttributeFilterModel, 'id'>) {
    const filterGroup: FilterGroupModel<AttributeFilterModel> = {
      id: nanoid(),
      source,
      type: FilterTypeEnum.ATTRIBUTE,
      layerIds: [layerId],
      filters: [{
        id: nanoid(),
        ...filter,
      }],
      operator: 'AND',
    };
    this.store$.dispatch(FilterActions.addFilterGroup({ filterGroup }));
  }

  private createFilter(groupId: string, filter: Omit<AttributeFilterModel, 'id'>) {
    this.store$.dispatch(FilterActions.addFilter({
      filterGroupId: groupId,
      filter: {
        id: nanoid(),
        ...filter,
      },
    }));
  }

  private updateFilter(groupId: string, filter: AttributeFilterModel) {
    this.store$.dispatch(FilterActions.updateFilter({
      filterGroupId: groupId,
      filter,
    }));
  }

  private getGroup$(source: string, layerId: string) {
    return this.store$.select(selectFilterGroupForType<AttributeFilterModel>(source, layerId, FilterTypeEnum.ATTRIBUTE));
  }

}
