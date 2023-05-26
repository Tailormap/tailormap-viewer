import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { setRouteBeforeLogin } from '../state/core.actions';
import { TailormapApiConstants, TailormapSecurityApiV1Service } from '@tailormap-viewer/api';

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
      this.router.navigateByUrl('/login');
    })(req, next);
  }

}
