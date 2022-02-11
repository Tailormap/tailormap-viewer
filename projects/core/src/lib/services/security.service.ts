import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {

  private static LOGIN_URL = '/api/login';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public login$(username: string, password: string): Observable<boolean> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return this.httpClient.post(SecurityService.LOGIN_URL, formData, {
      observe: 'response',
    }).pipe(map(response => response.status === 200));
  }

}
