import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/core.selectors';
import { Subject, takeUntil } from 'rxjs';
import { SecurityModel } from '@tailormap-viewer/api';
import { SecurityService } from '../../../services/security.service';
import { setLoginDetails, setRouteBeforeLogin } from '../../../state/core.actions';
import { MatMenu, MatMenuPanel } from '@angular/material/menu';
import { Router } from '@angular/router';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnDestroy {

  public userDetails: SecurityModel | null = null;
  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private securityService: SecurityService,
    private router: Router,
  ) {
    this.store$.select(selectUserDetails)
      .pipe(takeUntil(this.destroyed))
      .subscribe(userDetails => {
        this.userDetails = userDetails;
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public logout() {
    this.securityService.logout$()
      .subscribe(loggedOut => {
        if (loggedOut) {
          this.store$.dispatch(setLoginDetails({ loggedIn: false }));
        }
      });
  }

  public login() {
    this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
    this.router.navigateByUrl('/login');
  }

}
