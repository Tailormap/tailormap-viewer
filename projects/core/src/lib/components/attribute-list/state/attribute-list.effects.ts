import { Injectable } from '@angular/core';
import * as AttributeListActions from './attribute-list.actions';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { Store } from '@ngrx/store';

@Injectable()
export class AttributeListEffects {

  public loadDataForTab$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AttributeListActions.loadData),
      mergeMap(action => {
        console.log('Lets load some data');
        return this.attributeListDataService.loadDataForTab$(action.tabId).pipe(
          map(result => {
            console.log('The result is in', result);
            if (!result.success) {
              return AttributeListActions.loadDataFailed({ tabId: action.tabId, data: result });
            }
            return AttributeListActions.loadDataSuccess({ tabId: action.tabId, data: result });
          }),
        );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private attributeListDataService: AttributeListDataService,
  ) {
  }

}
