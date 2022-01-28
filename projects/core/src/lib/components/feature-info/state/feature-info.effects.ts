import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as FeatureInfoActions from './feature-info.actions';
import { concatMap, map } from 'rxjs';
import { FeatureInfoService } from '../feature-info.service';

@Injectable()
export class FeatureInfoEffects {

  public loadFeatureInfo$ = createEffect(() => {
      return this.actions$.pipe(
          ofType(FeatureInfoActions.loadFeatureInfo),
          concatMap(action => {
            return this.featureInfoService.getFeatures$(action.mapCoordinates)
              .pipe(
                map(result => {
                  if (!result) {
                    return FeatureInfoActions.loadFeatureInfoFailed({});
                  }
                  return FeatureInfoActions.loadFeatureInfoSuccess({ featureInfo: result });
                }),
              );
          }),
      );
  });

  public showDialogOnFeatureInfoSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FeatureInfoActions.loadFeatureInfoSuccess),
      map(() => FeatureInfoActions.showFeatureInfoDialog()),
    );
  });

  constructor(
    private actions$: Actions,
    private featureInfoService: FeatureInfoService,
  ) {}

}
