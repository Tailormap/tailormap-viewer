import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {

  constructor() { }

  public getMessage$(): Observable<string> {
    return of('Test2');
  }

}
