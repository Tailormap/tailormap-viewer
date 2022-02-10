import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as FeatureInfoActions from './feature-info.actions';
import { filter, map, switchMap } from 'rxjs';
import { FeatureInfoService } from '../feature-info.service';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';

@Injectable()
export class FeatureInfoEffects {

  public loadFeatureInfo$ = createEffect(() => {
      return this.actions$.pipe(
          ofType(FeatureInfoActions.loadFeatureInfo),
          switchMap(action => {
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
      map(action => {
        const count = FeatureInfoHelper.getTotalFeatureInfoCount(action.featureInfo);
        if (count === 0) {
          return FeatureInfoActions.hideFeatureInfoDialog();
        }
        return FeatureInfoActions.showFeatureInfoDialog();
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private featureInfoService: FeatureInfoService,
  ) {}

}
