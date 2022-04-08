import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CoreActions from './core.actions';
import { concatMap, map } from 'rxjs';
import { LoadApplicationService } from '../services/load-application.service';

@Injectable()
export class CoreEffects {

  public loadApplication$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadApplication),
      concatMap(action => {
        return this.loadApplicationService.loadApplication$({ id: action.id, name: action.name, version: action.version })
          .pipe(
            map(response => {
              if (!response.success || !response.result) {
                return CoreActions.loadApplicationFailed({ error: response.error });
              }
              return CoreActions.loadApplicationSuccess({
                application: response.result.application,
                components: response.result.components,
              });
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private loadApplicationService: LoadApplicationService,
  ) {}

}
