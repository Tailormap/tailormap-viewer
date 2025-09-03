import { Injectable, inject } from '@angular/core';
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
            return this.featureInfoService.getEditableFeatures$(action.coordinates, editLayer, action.pointerType)
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

}
