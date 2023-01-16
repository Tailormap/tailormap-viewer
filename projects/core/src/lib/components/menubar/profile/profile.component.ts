import { Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, OnInit, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/core.selectors';
import { catchError, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { SecurityModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel, UserResponseModel } from '@tailormap-viewer/api';
import { SecurityService } from '../../../services/security.service';
import { setLoginDetails, setRouteBeforeLogin } from '../../../state/core.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'tm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {

  public userDetails: SecurityModel | null = null;
  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private securityService: SecurityService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
  ) {}

  public ngOnInit() {
    this.store$.select(selectUserDetails)
      .pipe(takeUntil(this.destroyed))
      .subscribe(userDetails => {
        this.userDetails = userDetails;
        this.cdr.detectChanges();
      });

    this.api.getUser$()
      .pipe(
        take(1),
        catchError((): Observable<UserResponseModel> => of({ isAuthenticated: false, username: '' })),
      )
      .subscribe(userDetails => {
        this.store$.dispatch(setLoginDetails({ loggedIn: userDetails.isAuthenticated, user: { username: userDetails.username } }));
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
          window.location.reload();
        }
      });
  }

  public login() {
    this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
    this.router.navigateByUrl('/login');
  }

}
