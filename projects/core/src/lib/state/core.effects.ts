import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as CoreActions from './core.actions';
import { concatMap, map, tap, filter } from 'rxjs';
import { LoadViewerService } from '../services/load-viewer.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { UrlHelper } from '@tailormap-viewer/shared';

@Injectable()
export class CoreEffects {

  public loadViewer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewer),
      concatMap(action => {
        return this.loadViewerService.loadViewer$(action.id)
          .pipe(
            map(response => {
              if (!response.success || !response.result) {
                return CoreActions.loadViewerFailed({ error: response.error });
              }
              const viewer = response.result.viewer;
              return CoreActions.loadViewerSuccess({
                viewer: { ...viewer, id: `${viewer.kind}/${viewer.name}` },
              });
            }),
          );
      }),
    );
  });

  public updateUrlAfterViewerLoad$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoreActions.loadViewerSuccess),
      map(action => action.viewer.id.split('/').map(UrlHelper.getUrlSafeParam)),
      filter(paths => this.location.path() !== '/' + paths.join('/')),
      tap(paths => this.router.navigate(paths, { preserveFragment: true, skipLocationChange: true })),
    );
  }, { dispatch: false });

  constructor(
    private actions$: Actions,
    private loadViewerService: LoadViewerService,
    private location: Location,
    private router: Router,
  ) {}

}
