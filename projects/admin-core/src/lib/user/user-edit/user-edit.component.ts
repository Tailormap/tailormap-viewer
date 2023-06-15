import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { UserModel } from '@tailormap-admin/admin-api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();
  public user$: Observable<UserModel | null> = of(null);
  public updatedUser: UserModel | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroyed),
        map(params => params.get('userName')),
        distinctUntilChanged(),
        filter((userName): userName is string => !!userName),
      )
      .subscribe(userName => this.userService.selectUser(userName));
    this.user$ = this.userService.selectedUser$;
  }

  public ngOnDestroy(): void {
    this.clearSelectedUser();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateUser(updatedUser: UserModel) {
    this.updatedUser = updatedUser;
  }

  public delete(user: UserModel) {
    this.confirmDelete.confirm$(
      `Delete user ${user.username}`,
      `Are you sure you want to delete the user with username ${user.username}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.userService.deleteUser$(user.username)),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `User ${user.username} removed`);
        this.router.navigateByUrl('/users');
      });
  }

  public save() {
    if (!this.updatedUser) {
      return;
    }
    this.savingSubject.next(true);
    this.userService.addOrUpdateUser$(false, this.updatedUser)
      .pipe(take(1))
      .subscribe(updatedUser => {
        if (updatedUser) {
          this.adminSnackbarService.showMessage($localize `User updated`);
        }
        this.savingSubject.next(false);
      });
  }

  public clearSelectedUser() {
    this.userService.selectUser(null);
  }

}
