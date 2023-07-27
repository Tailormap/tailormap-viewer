import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { DestroyRef, Inject, Injectable } from '@angular/core';
import { TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel, UserModel } from '@tailormap-admin/admin-api';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { Store } from '@ngrx/store';
import { addUser, deleteUser, loadUsers, updateUser } from '../state/user.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectUsers, selectUsersLoadStatus } from '../state/user.selectors';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { UserAddUpdateModel } from '../models/user-add-update.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private selectedUser: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public selectedUser$: Observable<string | null> = this.selectedUser.asObservable();

  public constructor(
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private store$: Store,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
    private destroyRef: DestroyRef,
  ) {}

  public listenForUserChanges() {
    this.sseService.listenForEvents$<UserModel>('User')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateUserState(event.details.object.username, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateUserState(event.details.object.username, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateUserState(event.details.id, 'remove');
        }
      });
  }

  public getUsers$(): Observable<UserModel[]> {
    return this.store$.select(selectUsersLoadStatus)
      .pipe(
        tap(loadStatus => {
          if (loadStatus === LoadingStateEnum.INITIAL) {
            this.store$.dispatch(loadUsers());
          }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectUsers)),
      );
  }

  public getUserByName$(username: string): Observable<UserModel | null> {
    return this.getUsers$()
      .pipe(map(users => users.find(u => u.username === username) || null));
  }

  public selectUser(username: string | null): void {
    this.selectedUser.next(username);
  }

  public addOrUpdateUser$(add: boolean, user: UserAddUpdateModel): Observable<UserModel | null> {
    if (user.validUntil) {
      user.validUntil.setSeconds(0, 0);
    }
    if (add) {
      return this.adminApiService.createUser$({ user }).pipe(
        catchError((response) => {
          this.adminSnackbarService.showMessage($localize`Error while creating user ${user.username}. ${response.error?.message}`);
          return of(null);
        }),
        tap(response => {
          if (response) {
            this.updateUserState(response.username, 'add', response);
          }
        }),
      );
    }
    return this.adminApiService.updateUser$({ username: user.username, user }).pipe(
      catchError((response) => {
        this.adminSnackbarService.showMessage($localize`Error while updating user ${user.username}. ${response.error?.message}`);
        return of(null);
      }),
      tap(response => {
        if (response) {
          this.updateUserState(response.username, 'update', response);
        }
      }),
    );
  }

  public deleteUser$(userName: string) {
    return this.adminApiService.deleteUser$(userName)
      .pipe(
        catchError((response) => {
          this.adminSnackbarService.showMessage($localize`Error while deleting user ${userName}. ${response.error?.message}`);
          return of(false);
        }),
        tap(response => {
          if (response) {
            this.updateUserState(userName, 'remove');
            if (this.selectedUser.value === userName) {
              this.selectedUser.next(null);
            }
          }
        }),
      );
  }

  public validatePasswordStrength$(password: string) {
    return this.adminApiService.validatePasswordStrength$(password);
  }

  private updateUserState(
    name: string,
    type: 'add' | 'update' | 'remove',
    user?: UserModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`user-${type}-${name}`, () => {
      if (type === 'add' && user) {
        this.store$.dispatch(addUser({ user }));
      }
      if (type === 'update' && user) {
        this.store$.dispatch(updateUser({ user }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteUser({ userName: name }));
      }
    }, 50);
  }


}
