import { BehaviorSubject, catchError, Observable, of, Subject } from 'rxjs';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel, UserModel } from '@tailormap-admin/admin-api';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class UserDetailsService implements OnDestroy {
  // @ts-ignore
  private selectedUser: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);
  public selectedUser$: Observable<UserModel> = this.selectedUser.asObservable();
  private userList: BehaviorSubject<UserModel[]> = new BehaviorSubject<UserModel[]>([]);
  public userList$: Observable<UserModel[]> = this.userList.asObservable();
  private destroyed = new Subject();

  public constructor(@Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
                     private snackBar: MatSnackBar) {
    this.getUsers();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getUsers() {
    this.adminApiService.getUsers$()
      .pipe(
        catchError(err => {
          this.showErrorMessage($localize`Error while getting users ${err}`);
          return of(null);
        }),
      )
      .subscribe(users => {
        if (users) {
          this.userList.next(users);
        }
      });
  }

  public selectUser(username: string): void {
    this.adminApiService.getUser$(username, 'GroupName')
      .pipe(
        catchError(() => {
          this.showErrorMessage($localize`Error while getting user ${username}`);
          return of(null);
        }))
      .subscribe(user => {
        if (user) {
          if (user.validUntil) {
            // parse json response into date object
            // TODO we may need to do a timezone correction here
            user.validUntil = new Date(user.validUntil);
          }
          this.selectedUser.next(user);
        }
      });
  }

  public addOrUpdateUser(add: boolean, user: UserModel) {
    if (user.validUntil) {
      user.validUntil.setSeconds(0, 0);
    }
    if (add) {
      this.adminApiService.createUser$({ user }).pipe(
        catchError((response) => {
          this.showErrorMessage($localize`Error while creating user ${user.username}. ${response.error?.message}`);
          return of(null);
        }))
        .subscribe(createdUser => {
          if (createdUser) {
            this.getUsers();
          }
        });
    } else {
      this.adminApiService.updateUser$({ username: user.username, user }).pipe(
        catchError((response) => {
          this.showErrorMessage($localize`Error while updating user ${user.username}. ${response.error?.message}`);
          return of(null);
        }))
        .subscribe(_user => {
          if (_user) {
            this.getUsers();
          }
        });
    }
  }

  public deleteUser$(userName: string) {
    this.adminApiService.deleteUser$(userName)
      .pipe(
        catchError((response) => {
          this.showErrorMessage($localize`Error while deleting user ${userName}. ${response.error?.message}`);
          return of(false);
        }),
      )
      .subscribe(() => {
        this.getUsers();
      });
  }

  private showErrorMessage(message: string) {
    SnackBarMessageComponent.open$(this.snackBar, {
      message, duration: 10000, showCloseButton: true,
    });
  }
}
