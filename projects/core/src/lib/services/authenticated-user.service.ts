import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import {
  SecurityModel, SecurityPropertyModel, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { selectUserDetails, selectUserGroupProperties, selectUserIsAdmin, selectUserProperties } from '../state/core.selectors';
import { setLoginDetails } from '../state/core.actions';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedUserService {

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
  ) {
    this.api.getUser$()
      .pipe(take(1))
      .subscribe(userDetails => {
        this.store$.dispatch(setLoginDetails(userDetails));
      });
  }

  public getUserDetails$(): Observable<SecurityModel> {
    return this.store$.select(selectUserDetails);
  }

  public isAdminUser$(): Observable<boolean> {
    return this.store$.select(selectUserIsAdmin);
  }

  public getUserProperties$(): Observable<SecurityPropertyModel[]> {
    return this.store$.select(selectUserProperties);
  }

  public getUserGroupProperties$(): Observable<SecurityPropertyModel[]> {
    return this.store$.select(selectUserGroupProperties);
  }

  public logout$(): Observable<boolean> {
    return this.api.logout$()
      .pipe(
        take(1),
        tap(loggedOut => {
          if (loggedOut) {
            this.store$.dispatch(setLoginDetails({ isAuthenticated: false }));
          }
        }),
      );
  }

}
