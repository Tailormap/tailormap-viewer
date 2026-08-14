import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as EditActions from './edit.actions';
import { map, of, switchMap } from 'rxjs';
import { FeatureInfoService } from '../../feature-info';
import { withLatestFrom } from 'rxjs/operators';
import { selectSelectedCopyLayer, selectSelectedEditLayer } from './edit.selectors';
import { Store } from '@ngrx/store';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { GeometryType } from '@tailormap-viewer/api';

@Injectable()
export class EditEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private featureInfoService = inject(FeatureInfoService);
  private applicationLayerService = inject(ApplicationLayerService);

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
      withLatestFrom(
        this.store$.select(selectSelectedCopyLayer),
        this.store$.select(selectSelectedEditLayer),
      ),
      switchMap(([ action, copyLayer, editLayer ]) => {
        return this.featureInfoService.getFeaturesForLayer$(action.coordinates, copyLayer, action.pointerType).pipe(
          withLatestFrom(
            editLayer ? this.applicationLayerService.getLayerDetails$(editLayer) : of(null),
          ),
          map(([ featureInfo, layerDetails ]) => {
            if (!featureInfo) {
              return EditActions.loadCopyFeaturesFailed({});
            }
            const editGeometryType = layerDetails?.details.geometryType || GeometryType.GEOMETRY;
            return EditActions.loadCopyFeaturesSuccess({ editGeometryType, featureInfo: [featureInfo] });
          }),
        );
      }),
    );
  });

}
