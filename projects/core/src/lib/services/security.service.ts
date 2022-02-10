import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {

  public login$(_username: string, _password: string) {
    return of(true);
  }

}
