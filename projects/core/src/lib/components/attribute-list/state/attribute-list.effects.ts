import { Injectable } from '@angular/core';
import * as AttributeListActions from './attribute-list.actions';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { filter, map, mergeMap } from 'rxjs';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { Store } from '@ngrx/store';
import { selectAttributeListDataForId } from './attribute-list.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';

@Injectable()
export class AttributeListEffects {

  public loadDataForTab$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.loadData),
      filter(action => !!action.tabId),
      mergeMap(action => this.loadDataForTabId$(action.tabId)),
    );
  });

  public loadDataAfterPageChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.updatePage),
      concatLatestFrom(action => this.store$.select(selectAttributeListDataForId(action.dataId))),
      map(([ _action, data ]) => data),
      filter(TypesHelper.isDefined),
      mergeMap(data => this.loadDataForTabId$(data.tabId)),
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

  constructor(
    private actions$: Actions,
    private store$: Store,
    private attributeListDataService: AttributeListDataService,
  ) {
  }

}
