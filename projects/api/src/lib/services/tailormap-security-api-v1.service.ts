import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from '@angular/common/http';
import { LoginConfigurationModel, UserResponseModel } from '../models';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { TailormapSecurityApiV1ServiceModel } from './tailormap-security-api-v1.service.model';
import { TailormapApiConstants } from './tailormap-api.constants';
import { ExtendedUserResponseModel } from '../models/extended-user-response.model';

@Injectable()
export class TailormapSecurityApiV1Service implements TailormapSecurityApiV1ServiceModel {

  private httpClient = inject(HttpClient);
  private httpXsrfTokenExtractor = inject(HttpXsrfTokenExtractor);

  public getLoginConfiguration$(): Observable<LoginConfigurationModel> {
    return this.httpClient.get<LoginConfigurationModel>(
      `${TailormapApiConstants.BASE_URL}/login/configuration`,
    );
  }

  public getUser$(): Observable<ExtendedUserResponseModel> {
    const errorResponse: ExtendedUserResponseModel = { isAuthenticated: false, username: '', roles: [], properties: [], groupProperties: [] };
    return this.httpClient.get<UserResponseModel>(`${TailormapApiConstants.BASE_URL}/user`)
      .pipe(
        catchError((): Observable<ExtendedUserResponseModel> => {
          // isAuthenticated is false but actually we don't know. isHttpError means ignore result.
          return of({ ...errorResponse, isHttpError: true });
        }),
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
        return of({ isAuthenticated: false, username: '', roles: [], properties: [], groupProperties: [] });
      }),
    );
  }

  public logout$(): Observable<boolean> {
    return this.httpClient.post(TailormapApiConstants.LOGOUT_URL, null, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false)),
    );
  }

  public requestPasswordReset$(email: string): Observable<boolean> {
    const body = new HttpParams({
      fromObject: {
        email,
      },
    });
    return this.httpClient.post(`${TailormapApiConstants.BASE_URL}/password-reset`, body, { observe: 'response' }).pipe(
      map(response => response.status === 202),
      catchError(() => of(false)),
    );
  }

  public validatePasswordStrength$(password: string): Observable<boolean> {
    const body = new HttpParams().set('password', password);
    return this.httpClient.post<{ result: boolean }>(`${TailormapApiConstants.BASE_URL}/validate-password`, body)
      .pipe(map(response => response.result));
  }

  public resetPassword$(token: string, username: string, newPassword: string): Observable<boolean> {
    const body = new HttpParams().set('token', token).set('username', username).set('newPassword', newPassword);
    return this.httpClient.post(`${TailormapApiConstants.BASE_URL}/password-reset/confirm`, body, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false)),
    );
  }
}
