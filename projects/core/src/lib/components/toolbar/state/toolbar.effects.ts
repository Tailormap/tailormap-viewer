import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as ToolbarActions from './toolbar.actions';
import { map, of, switchMap, take, tap } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool, selectToolbarTool } from './toolbar.selectors';
import { Injectable } from '@angular/core';

@Injectable()
export class ToolbarEffects {

  public toggleTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.toggleTool),
      concatLatestFrom(action => this.store$.select(isActiveToolbarTool(action.tool))),
      map(([ action, isActive ]) => {
        if (isActive) {
          return ToolbarActions.deactivateTool({ tool: action.tool });
        }
        return ToolbarActions.activateTool({ tool: action.tool, enableArguments: action.enableArguments });
      }),
    );
  });

  public activateTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.activateTool),
      concatLatestFrom(action => this.store$.select(selectToolbarTool(action.tool))),
      switchMap(([ action, tool ]) => {
        if (!tool) {
          return of(null);
        }
        return this.mapService.getToolManager$()
          .pipe(
            take(1),
            tap(manager => {
              if (tool.mapToolId) {
                manager.enableTool(tool.mapToolId, true, action.enableArguments);
              }
            }),
          );
      }),
    );
  }, { dispatch: false });

  public deactivateTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.deactivateTool),
      concatLatestFrom(action => this.store$.select(selectToolbarTool(action.tool))),
      switchMap(([ _, tool ]) => {
        if (!tool) {
          return of(null);
        }
        return this.mapService.getToolManager$()
          .pipe(
            take(1),
            tap(manager => {
              if (tool.mapToolId) {
                manager.disableTool(tool.mapToolId);
              }
            }),
          );
      }),
    );
  }, { dispatch: false });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private mapService: MapService,
  ) {}

}
