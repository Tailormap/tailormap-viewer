import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as MapActions from './map.actions';
import { catchError, concatMap, map, of } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';

import * as CoreActions from '../../state/core.actions';

@Injectable()
export class MapEffects {

  private static LOAD_MAP_ERROR = $localize `Could not load map settings`;

  public triggerLoadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewerSuccess),
      map(action => MapActions.loadMap({ id: action.application.id })),
    );
  });

  public loadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MapActions.loadMap),
      concatMap(action => {
        return this.apiService.getMap$(action.id)
          .pipe(
            catchError(() => of(MapEffects.LOAD_MAP_ERROR)),
            map(response => {
              if (typeof response === 'string') {
                return MapActions.loadMapFailed({ error: response });
              }
              return MapActions.loadMapSuccess({
                ...response,
              });
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    @Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel,
  ) {}

}
