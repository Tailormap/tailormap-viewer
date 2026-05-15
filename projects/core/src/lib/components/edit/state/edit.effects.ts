import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as EditActions from './edit.actions';
import { map, switchMap } from 'rxjs';
import { FeatureInfoService } from '../../feature-info';
import { withLatestFrom } from 'rxjs/operators';
import { selectSelectedCopyLayer, selectSelectedEditLayer } from './edit.selectors';
import { Store } from '@ngrx/store';

@Injectable()
export class EditEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private featureInfoService = inject(FeatureInfoService);

  public loadEditFeatures$ = createEffect(() => {
      return this.actions$.pipe(
          ofType(EditActions.loadEditFeatures),
          withLatestFrom(this.store$.select(selectSelectedEditLayer)),
          switchMap(([ action, editLayer ]) => {
            return this.featureInfoService.getEditableFeatures$(action.coordinates, editLayer, action.pointerType).pipe(
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

  public loadCopyFeatures$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(EditActions.loadCopyFeatures),
      withLatestFrom(this.store$.select(selectSelectedCopyLayer)),
      switchMap(([ action, copyLayer ]) => {
        return this.featureInfoService.getFeaturesForLayer$(action.coordinates, copyLayer, action.pointerType).pipe(
          map(result => {
            if (!result) {
              return EditActions.loadCopyFeaturesFailed({});
            }
            return EditActions.loadCopyFeaturesSuccess({ featureInfo: [result] });
          }),
        );
      }),
    );
  });

}
