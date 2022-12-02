import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import * as FilterComponentActions from './filter-component.actions';
import { concatMap, map, mergeMap, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSelectedFilterGroup, selectSelectedLayers } from './filter-component.selectors';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { addFilterGroup, updateFilterGroup } from '../../../filter/state/filter.actions';
import { filter } from 'rxjs/operators';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { setSelectedFilterGroup } from './filter-component.actions';

@Injectable()
export class FilterComponentEffects {

  public updateSelectedLayers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FilterComponentActions.setSelectedLayers),
      concatLatestFrom(() => [
        this.store$.select(selectSelectedFilterGroup),
      ]),
      concatMap(([ action, selectedGroup ]): Observable<FilterGroupModel | null> => {
        if (!selectedGroup || !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return of(null);
        }
        return this.filterCrudService.updateLayers$(selectedGroup, action.layers);
      }),
      filter(TypesHelper.isDefined),
      map((result: FilterGroupModel) => {
        return updateFilterGroup({ filterGroup: result });
      }),
    );
  });

  public addGeometry$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FilterComponentActions.addGeometry),
      concatLatestFrom(() => [
        this.store$.select(selectSelectedFilterGroup),
        this.store$.select(selectSelectedLayers),
      ]),
      concatMap(([ action, selectedGroup, selectedLayers ]) => {
        if (selectedGroup && !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return of(null);
        }
        if (!selectedGroup) {
          return this.filterCrudService.createSpatialFilterGroup$([action.geometry], selectedLayers)
            .pipe(
              mergeMap(filterGroup => {
                return [ addFilterGroup({ filterGroup }), setSelectedFilterGroup({ filterGroup }) ];
              }),
            );
        }
        const updatedGroup = this.filterCrudService.addGeometry(selectedGroup, action.geometry);
        return of(updateFilterGroup({ filterGroup: updatedGroup }));
      }),
      filter(TypesHelper.isDefined),
    );
  });

  public removeGeometry$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FilterComponentActions.removeGeometry),
      concatLatestFrom(() => [
        this.store$.select(selectSelectedFilterGroup),
      ]),
      map(([ action, selectedGroup ]) => {
        if (!selectedGroup || !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return null;
        }
        const updatedGroup = this.filterCrudService.removeGeometry(selectedGroup, action.id);
        return updateFilterGroup({ filterGroup: updatedGroup });
      }),
      filter(TypesHelper.isDefined),
    );
  });

  public updateBuffer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FilterComponentActions.setBuffer),
      concatLatestFrom(() => [
        this.store$.select(selectSelectedFilterGroup),
      ]),
      map(([ action, selectedGroup ]) => {
        if (!selectedGroup || !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return null;
        }
        const updatedGroup = this.filterCrudService.updateBuffer(selectedGroup, action.buffer);
        return updateFilterGroup({ filterGroup: updatedGroup });
      }),
      filter(TypesHelper.isDefined),
    );
  });

  public setReferenceLayer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FilterComponentActions.setReferenceLayer),
      concatLatestFrom(() => [
        this.store$.select(selectSelectedFilterGroup),
        this.store$.select(selectSelectedLayers),
      ]),
      concatMap(([ action, selectedGroup, selectedLayers ]) => {
        if (selectedGroup && !FilterTypeHelper.isSpatialFilterGroup(selectedGroup)) {
          return of(null);
        }
        if (!selectedGroup) {
          return this.filterCrudService.createSpatialFilterGroup$([], selectedLayers, action.layer)
            .pipe(
              mergeMap(filterGroup => {
                return [ addFilterGroup({ filterGroup }), setSelectedFilterGroup({ filterGroup }) ];
              }),
            );
        }
        const updatedGroup = this.filterCrudService.updateReferenceLayer(selectedGroup, action.layer);
        return of(updateFilterGroup({ filterGroup: updatedGroup }));
      }),
      filter(TypesHelper.isDefined),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private filterCrudService: SpatialFilterCrudService,
  ) {}

}
