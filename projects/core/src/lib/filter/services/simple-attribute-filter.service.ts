import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import * as FilterActions from '../state/filter.actions';
import { selectFilterGroup } from '../state/filter.selectors';
import { map, Observable, take } from 'rxjs';
import { nanoid } from 'nanoid';

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
    this.getGroup$(source, layerId).subscribe(group => {
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

  public getFilters$(source: string, layerId: number) {
    return this.getGroup$(source, layerId)
      .pipe(map(group => group?.filters || []));
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
    this.getGroup$(source, layerId).subscribe(group => {
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
    this.getGroup$(source, layerId).subscribe(group => {
      if (!group) {
        return;
      }
      this.store$.dispatch(FilterActions.removeFilterGroup({ filterGroupId: group.id }));
    });
  }

  private createGroup(source: string, layerId: number, filter: Omit<AttributeFilterModel, 'id'>) {
    this.store$.dispatch(FilterActions.addFilterGroup({
      id: nanoid(),
      source,
      layerId,
      filters: [{
        id: nanoid(),
        ...filter,
      }],
      operator: 'AND',
    }));
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
    return this.store$.select(selectFilterGroup(source, layerId))
      .pipe(take(1));
  }

}
