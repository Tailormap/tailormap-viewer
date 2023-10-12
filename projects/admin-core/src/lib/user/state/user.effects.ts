import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as UserActions from './user.actions';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  ApiResponseHelper, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectGroupsLoadStatus, selectUsersLoadStatus } from './user.selectors';

@Injectable()
export class UserEffects {

  public loadUsers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.loadUsers),
      concatLatestFrom(() => this.store$.select(selectUsersLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(UserActions.loadUsersStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getUsers$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.users.error-loading-users:Error while loading list of users` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return UserActions.loadUsersFailed({ error: response.error });
              }
              return UserActions.loadUsersSuccess({ users: response });
            }),
          );
      }),
    );
  });

  public loadGroups$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.loadGroups),
      concatLatestFrom(() => this.store$.select(selectGroupsLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(UserActions.loadGroupsStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getGroups$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.groups.error-loading-groups:Error while loading list of groups` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return UserActions.loadGroupsFailed({ error: response.error });
              }
              return UserActions.loadGroupsSuccess({ groups: response });
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
  ) {}

}
