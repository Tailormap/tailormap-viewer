import { Injectable, Injector, ProviderToken } from '@angular/core';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LazyInjectService {

  constructor(private injector: Injector) {}

  public get$<T>(providerLoader: () => Promise<ProviderToken<T>>): Observable<T> {
    return from(providerLoader())
      .pipe(map(provider => this.injector.get(provider)));
  }

}
