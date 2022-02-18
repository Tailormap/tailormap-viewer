import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { setRouteBeforeLogin } from '../state/core.actions';
import { TailormapApiV1Service } from '@tailormap-viewer/api';
import { SecurityService } from '../services/security.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private store$: Store,
  ) {
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = req.clone({
      withCredentials: true,
    });
    console.log(req.url);
    return next.handle(authReq)
      .pipe(
        catchError(error => {
          if (
            error instanceof HttpErrorResponse
            && (req.url.startsWith(TailormapApiV1Service.BASE_URL) && req.url !== SecurityService.LOGIN_URL)
            && error.status === 401
          ) {
            this.store$.dispatch(setRouteBeforeLogin({ route: this.router.url }));
            this.router.navigateByUrl('/login');
          }
          return throwError(error);
        }),
      );
  }

}
