import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import * as FilterActions from '../state/filter.actions';
import { selectEnabledFilterGroups, selectFilterGroupForType } from '../state/filter.selectors';
import { map, Observable, take } from 'rxjs';
import { nanoid } from 'nanoid';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { FilterGroupModel } from '../models/filter-group.model';

@Injectable({
  providedIn: 'root',
})
export class SimpleAttributeFilterService {

  private store$ = inject(Store);

  public setFilter(
    source: string,
    layerId: number,
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

  public hasFilter$(source: string, layerId: number) {
    return this.getGroup$(source, layerId)
      .pipe(map(group => !!group));
  }

  public getFilters$(source: string, layerId: number): Observable<AttributeFilterModel[]> {
    return this.getGroup$(source, layerId)
      .pipe(map(group => {
        return (group?.filters || []).map(f => ({ ...f, disabled: group?.disabled }));
      }));
  }

  public getFiltersExcludingAttribute$(source: string, layerId: number, attribute: string) {
    return this.store$.select(selectEnabledFilterGroups)
      .pipe(take(1), map(groups => {
        return groups.map(group => {
          if(group.source !== source || !group.layerIds.includes(layerId)) {
            return group;
          }
          return {
            ...group,
            filters: group.filters.filter(f => FilterTypeHelper.isAttributeFilter(f) && f.attribute !== attribute),
          };
        });
      }));
  }

  public getFilterForAttribute$(
    source: string,
    layerId: number,
    attribute: string,
  ): Observable<AttributeFilterModel | null> {
    return this.getGroup$(source, layerId)
      .pipe(
        map(group => {
          return group
            ? group.filters.find(f => f.attribute === attribute) || null
            : null;
        }),
      );
  }

  public removeFilter(
    source: string,
    layerId: number,
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
    layerId: number,
  ) {
    this.getGroup$(source, layerId).pipe(take(1)).subscribe(group => {
      if (!group) {
        return;
      }
      this.store$.dispatch(FilterActions.removeFilterGroup({ filterGroupId: group.id }));
    });
  }

  private createGroup(source: string, layerId: number, filter: Omit<AttributeFilterModel, 'id'>) {
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

  private getGroup$(source: string, layerId: number) {
    return this.store$.select(selectFilterGroupForType<AttributeFilterModel>(source, layerId, FilterTypeEnum.ATTRIBUTE));
  }

}
