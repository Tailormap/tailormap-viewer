import { Injectable, Injector, ProviderToken } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LazyInjectService {

  constructor(private injector: Injector) {}

  public get$<T>(providerLoader$: () => Observable<ProviderToken<T>>): Observable<T> {
    return providerLoader$()
      .pipe(map(provider => this.injector.get(provider)));
  }

}
