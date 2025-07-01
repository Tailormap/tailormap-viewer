import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { UserAddUpdateModel } from '../models/user-add-update.model';

@Component({
  selector: 'tm-admin-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserCreateComponent implements OnDestroy {
  private userDetailsService = inject(UserService);
  private router = inject(Router);
  private adminSnackbarService = inject(AdminSnackbarService);


  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public user: UserAddUpdateModel | null = null;

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateUser($event: UserAddUpdateModel | null) {
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
          this.adminSnackbarService.showMessage($localize `:@@admin-core.users.user-created:User ${createdUser.username} created`);
          this.router.navigateByUrl('/admin/users/user/' + createdUser.username);
        }
        this.savingSubject.next(false);
      });
  }

}
