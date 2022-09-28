import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CoreActions from './core.actions';
import { concatMap, map, tap } from 'rxjs';
import { LoadApplicationService } from '../services/load-application.service';
import { Location } from '@angular/common';
import { UrlHelper } from '@tailormap-viewer/shared';
import { filter } from 'rxjs/operators';

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

  public updateUrlAfterApplicationLoad$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadApplicationSuccess),
      map(action => UrlHelper.getUrlSafeParam(action.application.name)),
      // replace the current url if the application is loaded but the URL does not match /app/<name> or /app/<name>/<version>
      filter(name => !(new RegExp(`^/app/${name}/?.*$`, 'i').test(this.location.path()))),
      tap(name => this.location.replaceState(`/app/${name}`)),
    );
  }, { dispatch: false });

  constructor(
    private actions$: Actions,
    private loadApplicationService: LoadApplicationService,
    private location: Location,
  ) {}

}
