import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { setInsufficientRights, setRouteBeforeLogin } from '../state/core.actions';
import { TailormapApiConstants, TailormapSecurityApiV1Service } from '@tailormap-viewer/api';
import { selectUserDetails } from '../state/core.selectors';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private store$: Store,
  ) {
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return TailormapSecurityApiV1Service.createSecurityInterceptor(TailormapApiConstants.BASE_URL, () => {
      this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
      this.store$.select(selectUserDetails)
        .pipe(take(1))
        .subscribe(userDetails => {
          if (userDetails.isAuthenticated) {
            // If the user is authenticated but gets a 401, it means that the user is not authorized to access the resource.
            this.store$.dispatch(setInsufficientRights({ hasInsufficientRights: true }));
          }
          this.router.navigateByUrl('/login');
        });
    })(req, next);
  }

}
