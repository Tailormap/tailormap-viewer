import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { UserModel } from '@tailormap-admin/admin-api';
import { Router } from '@angular/router';
import { UserDetailsService } from '../services/user-details.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public user: Omit<UserModel, 'id'> | null = null;

  constructor(
    private userDetailsService: UserDetailsService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateUser($event: Omit<UserModel, 'id'>) {
    this.user = $event;
  }

  public save() {
    if (!this.user) {
      return;
    }
    this.savingSubject.next(true);
    this.userDetailsService.addOrUpdateUser$(true, this.user)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createdUser => {
        if (createdUser) {
          this.adminSnackbarService.showMessage($localize `User ${createdUser.username} created`);
          this.router.navigateByUrl('/users/user/' + createdUser.username);
        }
        this.savingSubject.next(false);
      });
  }

}
