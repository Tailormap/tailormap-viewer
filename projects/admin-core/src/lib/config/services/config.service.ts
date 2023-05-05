import { Inject, Injectable } from '@angular/core';
import { ConfigModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  public static DEFAULT_APPLICATION_KEY = 'default-app';

  private configSubject = new BehaviorSubject(new Map<string, ConfigModel>());

  constructor(
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
  ) {
  }

  public getConfig$(key: string): Observable<ConfigModel | null> {
    return this.configSubject.asObservable()
      .pipe(
        switchMap(configMap => {
          const config = configMap.get(key);
          if (config) {
            return of(config);
          }
          return this.adminApiService.getConfig$({ key })
            .pipe(
              catchError(() => of(null)),
              tap(c => {
                if (c) {
                  this.setConfigValue(c);
                }
              }),
              switchMap(() => this.configSubject.asObservable().pipe(
                map(m => m.get(key) || null),
              )),
            );
        }),
      );
  }

  public getConfigValue$(key: string): Observable<string | null> {
    return this.getConfig$(key)
      .pipe(
        map(c => c?.value ?? null),
      );
  }

  public saveConfig$(config: ConfigModel): Observable<ConfigModel> {
    return this.adminApiService.updateConfig$({ config })
      .pipe(
        catchError(err => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return this.adminApiService.createConfig$({ config })
              .pipe(catchError(() => of(config)));
          }
          return of(config);
        }),
        tap(c => this.setConfigValue(c)),
      );
  }

  private setConfigValue(config: ConfigModel) {
    const currentConfig = this.configSubject.value;
    currentConfig.set(config.key, config);
    this.configSubject.next(currentConfig);
  }

  private getDefaultConfig(key: string): ConfigModel {
    return { key, value: null, jsonValue: null };
  }

}
