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
      switchMap(() => this.doRequest$(SecurityService.LOGIN_URL, body, /^(?!.*[?]error$).*$/)),
    );
  }

  public logout$(): Observable<boolean> {
    return this.doRequest$(SecurityService.LOGOUT_URL, null, /.*login\?logout$/);
  }

  private doRequest$(url: string, body: null | HttpParams, urlShouldMatch: RegExp) {
    return this.httpClient.post(url, body, { observe: 'response', responseType: 'text' }).pipe(
      map(response => response.status === 200 && urlShouldMatch.test(response.url || '')),
      catchError(() => of(false)),
    );
  }

}
