import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
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
      this.store$.select(selectUserDetails)
        .pipe(take(1))
        .subscribe(userDetails => {
          this.router.navigateByUrl('/login', {
            state: {
              hasInsufficientRights: userDetails.isAuthenticated,
              userName: userDetails.username,
              routeBeforeLogin: this.router.url,
            },
          });
        });
    })(req, next);
  }

}
