import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {

  public static LOGIN_URL = '/api/login';
  public static LOGOUT_URL = '/api/logout';

  constructor(
    private httpClient: HttpClient,
    private httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ) {
  }

  public login$(username: string, password: string): Observable<boolean> {
    // When logging in as the first thing after navigation start we may not have a XSRF token yet. If so, do a request to get it first.
    const ensureXsrfToken$ = this.httpXsrfTokenExtractor.getToken() == null
      ? this.httpClient.options(SecurityService.LOGIN_URL).pipe(catchError(() => of(true)))
      : of(true);

    const body = new HttpParams({
      fromObject: {
        username,
        password,
      },
    });
    return ensureXsrfToken$.pipe(
      switchMap(() => this.httpClient.post(SecurityService.LOGIN_URL, body, { observe: 'response', responseType: 'text' })),
      map(response => response.status === 200 && !((response.url || '').endsWith("?error"))),
      catchError(() => of(false)),
    );
  }

  public logout$() {
    return this.httpClient.post(SecurityService.LOGOUT_URL, null, { observe: 'response', responseType: 'text' }).pipe(
      map(response => response.status === 200 && (response.url || '').endsWith("login?logout")),
    );
  }
}
