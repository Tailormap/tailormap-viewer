import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { Inject, Injectable } from '@angular/core';
import { TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel, UserModel } from '@tailormap-admin/admin-api';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class UserDetailsService {

  private selectedUser: BehaviorSubject<UserModel | null> = new BehaviorSubject<UserModel|null>(null);
  public selectedUser$: Observable<UserModel|null> = this.selectedUser.asObservable();

  private userList: BehaviorSubject<UserModel[]> = new BehaviorSubject<UserModel[]>([]);
  private userList$: Observable<UserModel[]> = this.userList.asObservable();
  private userListFetched = false;

  public constructor(
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
  ) {
    this.getUsers();
  }

  public getUsers$(): Observable<UserModel[]> {
    if (!this.userListFetched) {
      this.getUsers();
    }
    return this.userList$;
  }

  public getUsers() {
    this.adminApiService.getUsers$()
      .pipe(
        catchError(err => {
          this.adminSnackbarService.showMessage($localize`Error while getting users ${err}`);
          return of(null);
        }),
      )
      .subscribe(users => {
        if (users) {
          this.userListFetched = true;
          this.userList.next(users);
        }
      });
  }

  public selectUser(username: string | null): void {
    if (username === null) {
      this.selectedUser.next(null);
      return;
    }
    this.adminApiService.getUser$(username, 'GroupName')
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize`Error while getting user ${username}`);
          return of(null);
        }))
      .subscribe(user => {
        if (user) {
          this.selectedUser.next(user);
        }
      });
  }

  public addOrUpdateUser$(add: boolean, user: UserModel): Observable<UserModel | null> {
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
            this.userList.next([ ...this.userList.value, response ]);
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
          this.userList.next(this.userList.value.map(u => u.username === user.username ? response : u));
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
            this.userList.next(this.userList.value.filter(u => u.username !== userName));
            if (this.selectedUser.value?.username === userName) {
              this.selectedUser.next(null);
            }
          }
        }),
      );
  }

  public validatePasswordStrength$(password: string) {
    return this.adminApiService.validatePasswordStrength$(password);
  }

}
