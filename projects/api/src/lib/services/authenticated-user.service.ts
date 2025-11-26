import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, take, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from './tailormap-security-api-v1.service.injection-token';
import { SecurityModel, SecurityPropertyModel } from '../models';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { TailormapApiConstants } from './tailormap-api.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedUserService {

  private authenticatedUserSubject = new BehaviorSubject<SecurityModel>({ isAuthenticated: false });
  private authenticatedUser$ = this.authenticatedUserSubject.asObservable();
  private api = inject(TAILORMAP_SECURITY_API_V1_SERVICE);

  public fetchUserDetails() {
    this.api.getUser$()
      .pipe(take(1))
      .subscribe(userDetails => {
        this.setUserDetails(userDetails);
      });
  }

  public getUserDetails$(): Observable<SecurityModel> {
    return this.authenticatedUser$;
  }

  public isAdminUser$(): Observable<boolean> {
    return this.authenticatedUser$.pipe(
      map(user => user.roles?.includes('admin') ?? false),
    );
  }

  public getUserProperties$(): Observable<SecurityPropertyModel[]> {
    return this.authenticatedUser$.pipe(
      map(user => user.properties || []),
    );
  }

  public getUserGroupProperties$(): Observable<SecurityPropertyModel[]> {
    return this.authenticatedUser$.pipe(
      map(user => user.groupProperties || []),
    );
  }

  public setUserDetails(user: SecurityModel) {
    this.authenticatedUserSubject.next(user);
  }

  public logout$(): Observable<boolean> {
    return this.api.logout$()
      .pipe(
        take(1),
        tap(loggedOut => {
          if (loggedOut) {
            this.setUserDetails({ isAuthenticated: false });
          }
        }),
      );
  }

  public createSecurityInterceptor(shouldLogin: (userDetails: SecurityModel) => void) {
    return (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> => {
      const authReq = req.clone({
        withCredentials: req.url.startsWith(TailormapApiConstants.BASE_URL)
          ? true
          : req.withCredentials,
      });
      return next.handle(authReq)
        .pipe(
          catchError(error => {
            if (
              error instanceof HttpErrorResponse
              && (req.url.startsWith(TailormapApiConstants.BASE_URL) && req.url !== TailormapApiConstants.LOGIN_URL)
              && (error.status === 401 || error.status === 403 || AuthenticatedUserService.isUnauthorizedMethod(error))
            ) {
              this.getUserDetails$()
                .pipe(take(1))
                .subscribe(userDetails => {
                  shouldLogin(userDetails);
                });
            }
            return throwError(error);
          }),
        );
    };
  }

  private static isUnauthorizedMethod(error: HttpErrorResponse) {
    return error.url?.includes(TailormapApiConstants.UNAUTHORIZED_URL) && error.status === 405;
  }

}
