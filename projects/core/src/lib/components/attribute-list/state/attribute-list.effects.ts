import { Injectable, inject } from '@angular/core';
import * as AttributeListActions from './attribute-list.actions';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { debounceTime, filter, groupBy, map, mergeMap, of, Subject, switchMap, tap } from 'rxjs';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { Store } from '@ngrx/store';
import { selectAttributeListDataForId, selectAttributeListRow, selectAttributeListTabForDataId } from './attribute-list.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';
import { selectViewerId } from '../../../state/core.selectors';
import { MapService } from '@tailormap-viewer/map';
import { AttributeListManagerService } from '../services/attribute-list-manager.service';
import { selectLayer } from '../../../map';

@Injectable()
export class AttributeListEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private attributeListDataService = inject(AttributeListDataService);
  private mapService = inject(MapService);
  private managerService = inject(AttributeListManagerService);

  private loadDataForTabSubject = new Subject<string>();

  public loadDataForTab$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.loadData),
      filter(action => !!action.tabId),
      tap(action => this.loadDataForTabId(action.tabId)),
    );
  }, { dispatch: false });

  public loadDataAfterSelectedDataIdChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.setSelectedDataId),
      filter(action => !!action.tabId),
      tap(action => this.loadDataForTabId(action.tabId)),
    );
  }, { dispatch: false });

  public loadDataAfterChanges$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.updatePage, AttributeListActions.updateSort),
      concatLatestFrom(action => {
        return this.store$.select(selectAttributeListDataForId(action.dataId));
      }),
      map(([ _action, data ]) => data),
      filter(TypesHelper.isDefined),
      tap(data => this.loadDataForTabId(data.tabId)),
    );
  }, { dispatch: false });

  public loadData$ = createEffect(() => {
    return this.loadDataForTabSubject.asObservable().pipe(
      groupBy(tabId => tabId),
      mergeMap(tabIds$ => tabIds$.pipe(
        debounceTime(50),
        switchMap(tabId => this.attributeListDataService.loadDataForTab$(tabId).pipe(
          map(result => {
            if (!result.success) {
              return AttributeListActions.loadDataFailed({ tabId, data: result });
            }
            return AttributeListActions.loadDataSuccess({ tabId, data: result });
          }),
        )),
      )),
    );
  });

  public highlightSelectedFeature$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.updateRowSelected),
      filter(action => action.selected),
      concatLatestFrom(action => [
        this.store$.select(selectAttributeListTabForDataId(action.dataId)),
        this.store$.select(selectAttributeListRow(action.dataId, action.rowId)),
        this.store$.select(selectViewerId),
        this.mapService.getProjectionCode$(),
      ]),
      concatLatestFrom(([ _action, tab ]) => this.store$.select(selectLayer(tab?.layerId || ''))),
      filter(([[ _action, tab, row, applicationId ], layer ]) => !!tab && !!row && applicationId !== null && !!layer),
      switchMap(([[ _action, tab, row, applicationId ], layer ]) => {
        if (!row || !row.__fid || !tab || !tab.layerId || applicationId === null) {
          return of({ type: 'noop' });
        }
        return this.managerService.getFeatures$(tab.tabSourceId, {
          applicationId,
          layerId: tab.layerId,
          layerName: layer?.layerName || '',
          __fid: row.__fid,
        }).pipe(
          map(result => {
            const feature = result.features && result.features.length > 0
              ? { ...result.features[0], tabId: tab.id }
              : null;
            return AttributeListActions.setHighlightedFeature({ feature });
          }),
        );
      }),
    );
  });

  private loadDataForTabId(tabId: string) {
    this.loadDataForTabSubject.next(tabId);
  }

}
