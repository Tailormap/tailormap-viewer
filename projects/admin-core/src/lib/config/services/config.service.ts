import { Inject, Injectable } from '@angular/core';
import { ConfigModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
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
        tap(configMap => {
          if (!configMap.has(key)) {
            this.fetchConfig$(key);
          }
        }),
        map(configMap => {
          return configMap.get(key) || null;
        }),
      );
  }

  private fetchConfig$(key: string): void {
    this.adminApiService.getConfig$({ key })
      .pipe(
        catchError(() => of(null)),
      )
      .subscribe(config => {
        if (config) {
          this.setConfigValue(config);
        }
      });
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
