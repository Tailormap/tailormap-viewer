import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as EditActions from './edit.actions';
import { map, switchMap } from 'rxjs';
import { FeatureInfoService } from '../../feature-info/feature-info.service';
import { withLatestFrom } from 'rxjs/operators';
import { selectSelectedEditLayer } from './edit.selectors';
import { Store } from '@ngrx/store';

@Injectable()
export class EditEffects {

  public loadEditFeatures$ = createEffect(() => {
      return this.actions$.pipe(
          ofType(EditActions.loadEditFeatures),
          withLatestFrom(this.store$.select(selectSelectedEditLayer)),
          switchMap(([ action, editLayer ]) => {
            return this.featureInfoService.getEditableFeatures$(action.coordinates, editLayer)
              .pipe(
                map(result => {
                  if (!result) {
                    return EditActions.loadEditFeaturesFailed({});
                  }
                  return EditActions.loadEditFeaturesSuccess({ featureInfo: result });
                }),
              );
          }),
      );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private featureInfoService: FeatureInfoService,
  ) {}

}
