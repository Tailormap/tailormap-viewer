import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as EditActions from './edit.actions';
import { filter, map, switchMap } from 'rxjs';
import { FeatureInfoService } from '../../feature-info/feature-info.service';
import { withLatestFrom } from 'rxjs/operators';
import { selectEditActive, selectSelectedEditLayer } from './edit.selectors';
import { Store } from '@ngrx/store';
import { activateTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { setEditActive } from './edit.actions';
import { hideFeatureInfoDialog } from '../../feature-info/state/feature-info.actions';

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

  public activeTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(activateTool),
      withLatestFrom(this.store$.select(selectEditActive)),
      filter(([ action, editActive ]) => editActive && action.tool !== ToolbarComponentEnum.EDIT),
      map(() => {
        return setEditActive({ active: false });
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private featureInfoService: FeatureInfoService,
  ) {}

}
