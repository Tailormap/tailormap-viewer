import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { setInsufficientRights, setRouteBeforeLogin } from '../state/admin-core.actions';
import { Routes } from '../routes';
import { TailormapSecurityApiV1Service } from '@tailormap-viewer/api';
import { selectUserDetails } from '../state/admin-core.selectors';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private store$: Store,
  ) {
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return TailormapSecurityApiV1Service.createSecurityInterceptor(TailormapAdminApiV1Service.BASE_URL, () => {
      this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
      this.store$.select(selectUserDetails)
        .pipe(take(1))
        .subscribe(userDetails => {
          if (userDetails.isAuthenticated) {
            // If the user is authenticated but gets a 401, it means that the user is not authorized to access the resource.
            this.store$.dispatch(setInsufficientRights({ hasInsufficientRights: true }));
          }
          this.router.navigateByUrl(Routes.LOGIN);
        });
    })(req, next);
  }

}
