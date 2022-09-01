import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as MapActions from './map.actions';
import { catchError, concatMap, map, of } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';

import * as CoreActions from '../../state/core.actions';
import { ServerTypeHelper } from '@tailormap-viewer/map';

@Injectable()
export class MapEffects {

  private static LOAD_MAP_ERROR = $localize `Could not load map settings`;

  public triggerLoadMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadApplicationSuccess),
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
              response.services = response.services.map(service => ({
                ...service,
                // resolve 'auto' server types for services for server-specific features such as hi dpi maps and legends, etc.
                resolvedServerType: ServerTypeHelper.resolveAutoServerType(service),
              }));
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
