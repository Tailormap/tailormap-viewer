import { BehaviorSubject, map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

export enum ApplicationFeature {
  SEARCH_INDEX = 'SEARCH_INDEX',
  TASKS = 'TASKS',
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationFeatureSwitchService {

  // static array now, could be based on an API call in the future to dynamically enable/disable features
  private featuresEnabled = new BehaviorSubject<{ feature: ApplicationFeature; enabled: boolean }[]>([
    { feature: ApplicationFeature.SEARCH_INDEX, enabled: true },
    { feature: ApplicationFeature.TASKS, enabled: false },
  ]);

  public isFeatureEnabled$(feature: ApplicationFeature): Observable<boolean> {
    return this.featuresEnabled.asObservable().pipe(map(features => {
      return features.find(f => f.feature === feature)?.enabled ?? false;
    }));
  }

}
