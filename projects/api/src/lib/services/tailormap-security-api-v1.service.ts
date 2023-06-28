import { Injectable } from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpParams, HttpRequest, HttpXsrfTokenExtractor,
} from '@angular/common/http';
import { LoginConfigurationModel, UserResponseModel } from '../models';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { TailormapSecurityApiV1ServiceModel } from './tailormap-security-api-v1.service.model';
import { TailormapApiConstants } from './tailormap-api.constants';

@Injectable()
export class TailormapSecurityApiV1Service implements TailormapSecurityApiV1ServiceModel {

  constructor(
    private httpClient: HttpClient,
    private httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ) {
  }

  public static createSecurityInterceptor(baseUrl: string, shouldLogin: () => void) {
    return (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> => {
      const authReq = req.clone({
        withCredentials: req.url.startsWith(baseUrl)
          ? true
          : req.withCredentials,
      });
      return next.handle(authReq)
        .pipe(
          catchError(error => {
            if (
              error instanceof HttpErrorResponse
              && (req.url.startsWith(baseUrl) && req.url !== TailormapApiConstants.LOGIN_URL)
              && error.status === 401
            ) {
              shouldLogin();
            }
            return throwError(error);
          }),
        );
    };
  }

  public getLoginConfiguration$(): Observable<LoginConfigurationModel> {
    return this.httpClient.get<LoginConfigurationModel>(
      `${TailormapApiConstants.BASE_URL}/login/configuration`,
    );
  }

  public getUser$(): Observable<UserResponseModel> {
    return this.httpClient.get<UserResponseModel>(
      `${TailormapApiConstants.BASE_URL}/user`,
    ).pipe(
      catchError((): Observable<UserResponseModel> => of({ isAuthenticated: false, username: '', roles: [] })),
    );
  }

  public login$(username: string, password: string): Observable<UserResponseModel> {
    // When logging in as the first thing after navigation start we may not have a XSRF token yet. If so, do a request to get it first.
    const ensureXsrfToken$ = this.httpXsrfTokenExtractor.getToken() == null
      ? this.httpClient.options(TailormapApiConstants.LOGIN_URL).pipe(catchError(() => of(true)))
      : of(true);

    const body = new HttpParams({
      fromObject: {
        username,
        password,
      },
    });
    return ensureXsrfToken$.pipe(
      switchMap(() => {
        return this.httpClient.post(TailormapApiConstants.LOGIN_URL, body, { observe: 'response', responseType: 'text' }).pipe(
          map(response => response.status === 200 && /^(?!.*[?]error$).*$/.test(response.url || '')),
          catchError(() => of(false)),
        );
      }),
      switchMap((success): Observable<UserResponseModel> => {
        if (success) {
          return this.getUser$();
        }
        return of({ isAuthenticated: false, username: '', roles: [] });
      }),
    );
  }

  public logout$(): Observable<boolean> {
    return this.httpClient.post(TailormapApiConstants.LOGOUT_URL, null, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false)),
    );
  }

}
