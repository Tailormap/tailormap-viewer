import { Injectable, inject } from '@angular/core';
import * as AttributeListActions from './attribute-list.actions';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { filter, map, mergeMap, of } from 'rxjs';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { Store } from '@ngrx/store';
import { selectAttributeListDataForId, selectAttributeListRow, selectAttributeListTabForDataId } from './attribute-list.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';
import { selectViewerId } from '../../../state/core.selectors';
import { MapService } from '@tailormap-viewer/map';
import { AttributeListManagerService } from '../services/attribute-list-manager.service';

@Injectable()
export class AttributeListEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private attributeListDataService = inject(AttributeListDataService);
  private mapService = inject(MapService);
  private managerService = inject(AttributeListManagerService);


  public loadDataForTab$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.loadData),
      filter(action => !!action.tabId),
      mergeMap(action => this.loadDataForTabId$(action.tabId)),
    );
  });

  public loadDataAfterChanges$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.updatePage, AttributeListActions.updateSort),
      concatLatestFrom(action => this.store$.select(selectAttributeListDataForId(action.dataId))),
      map(([ _action, data ]) => data),
      filter(TypesHelper.isDefined),
      mergeMap(data => this.loadDataForTabId$(data.tabId)),
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
      filter(([ _action, tab, row, applicationId ]) => !!tab && !!row && applicationId !== null),
      mergeMap(([ _action, tab, row, applicationId ]) => {
        if (!row || !row.__fid || !tab || !tab.layerId || applicationId === null) {
          return of({ type: 'noop' });
        }
        return this.managerService.getFeatures$(tab.tabSourceId, {
          applicationId,
          layerId: tab.layerId,
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

  private loadDataForTabId$(tabId: string) {
    return this.attributeListDataService.loadDataForTab$(tabId).pipe(
      map(result => {
        if (!result.success) {
          return AttributeListActions.loadDataFailed({ tabId, data: result });
        }
        return AttributeListActions.loadDataSuccess({ tabId, data: result });
      }),
    );
  }

}
