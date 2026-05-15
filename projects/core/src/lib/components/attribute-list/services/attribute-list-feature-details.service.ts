import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectDataForSelectedTab, selectSelectedTab } from '../state/attribute-list.selectors';
import { map, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, concatMap, forkJoin, Observable, of, tap } from 'rxjs';
import { selectViewerId } from '../../../state';
import { FeatureDetailsModel, GetFeatureDetailsParams } from '../models/attribute-list-api-service.model';

@Injectable({
  providedIn: 'root',
})
export class AttributeListFeatureDetailsService {

  private store$ = inject(Store);
  private attributeListManagerService = inject(AttributeListManagerService);

  private canExpandRowsCache = new Map<string, boolean>();

  public canExpandRows$ = combineLatest([
    this.store$.select(selectViewerId),
    this.store$.select(selectSelectedTab),
  ]).pipe(
    concatMap(([ applicationId, tab ]): Observable<[ boolean, string ]> => {
      if (!applicationId || !tab || !tab.layerId) {
        return of([ false, '' ]);
      }
      const key = `${applicationId}_${tab?.layerId}`;
      const canExpandCached = this.canExpandRowsCache.get(key);
      if (typeof canExpandCached === 'boolean') {
        return of([ canExpandCached, key ]);
      }
      return forkJoin([
        this.attributeListManagerService.canExpandRow$(tab.tabSourceId, { layerId: tab.layerId, applicationId }),
        of(key),
      ]);
    }),
    tap(([ canExpand, key ]) => {
      if (key) {
        this.canExpandRowsCache.set(key, canExpand);
      }
    }),
    map(([ canExpand, _key ]) => canExpand),
  );

  private featureDetailsKey$ = combineLatest([ this.store$.select(selectViewerId), this.store$.select(selectSelectedTab) ]).pipe(
    map(([ applicationId, tab ]) => {
      if (!applicationId || !tab || !tab.layerId) {
        return null;
      }
      return this.getFeatureDetailsKey(applicationId, tab.layerId);
    }),
  );

  private featureDetails = new BehaviorSubject<Map<string, Map<string, FeatureDetailsModel>>>(new Map());

  public featureDetails$ = combineLatest([
    this.featureDetails.asObservable(),
    this.featureDetailsKey$,
  ]).pipe(map(([ featureDetailsMap, key ]) => {
    return featureDetailsMap.get(key ?? '') || new Map<string, FeatureDetailsModel>();
  }));

  private loadingFeatureDetailsIds = new BehaviorSubject<Map<string, Set<string>>>(new Map());

  public loadingFeatureDetailsIds$ = combineLatest([
    this.loadingFeatureDetailsIds.asObservable(),
    this.featureDetailsKey$,
  ]).pipe(map(([ loadingIds, key ]) => loadingIds.get(key ?? '') || new Set<string>()));

  public loadFeatureDetailsForFeature($event: string) {
    combineLatest([
      this.store$.select(selectSelectedTab),
      this.store$.select(selectDataForSelectedTab),
      this.store$.select(selectViewerId),
    ])
      .pipe(
        take(1),
        switchMap(([ selectedTab, selectedData, applicationId ]) => {
          if (!selectedTab || !selectedTab.layerId || applicationId === null || !selectedData) {
            return of(null);
          }
          const params = { layerId: selectedTab.layerId, applicationId, __fid: $event };
          const key = this.getFeatureDetailsKey(params.applicationId, params.layerId);
          const currentDetails = this.featureDetails.value.get(key);
          if (currentDetails && currentDetails.has(params.__fid)) {
            // already loaded
            return of(null);
          }
          // Little side effect to mark as loading
          this.updateLoadingFeatureDetailsIds(key, params.__fid, true);
          return this.attributeListManagerService.getFeatureDetails$(selectedTab.tabSourceId, params)
            .pipe(
              take(1),
              map(featureDetails => ({ featureDetails, params } )),
              tap(() => this.updateLoadingFeatureDetailsIds(key, params.__fid, false)),
            );
        }),
      )
      .subscribe((featureDetails: { params: GetFeatureDetailsParams; featureDetails: FeatureDetailsModel | null } | null) => {
        if (!featureDetails || !featureDetails.featureDetails) {
          return;
        }
        const key = this.getFeatureDetailsKey(featureDetails.params.applicationId, featureDetails.params.layerId);
        const currentDetails = this.featureDetails.value.get(key) || new Map<string, FeatureDetailsModel>();
        currentDetails.set(featureDetails.params.__fid, featureDetails.featureDetails);
        const newFeatureDetailsMap = new Map(this.featureDetails.value);
        newFeatureDetailsMap.set(key, currentDetails);
        this.featureDetails.next(newFeatureDetailsMap);
      });
  }

  private getFeatureDetailsKey(applicationId: string, layerId: string) {
    return `${applicationId}_${layerId}`;
  }

  private updateLoadingFeatureDetailsIds(key: string, __fid: string, isLoading: boolean) {
    const currentLoadingIds = this.loadingFeatureDetailsIds.value.get(key) || new Set<string>();
    const newLoadingIds = new Set(currentLoadingIds);
    if (isLoading) {
      newLoadingIds.add(__fid);
    } else {
      newLoadingIds.delete(__fid);
    }
    const newLoadingMap = new Map(this.loadingFeatureDetailsIds.value);
    newLoadingMap.set(key, newLoadingIds);
    this.loadingFeatureDetailsIds.next(newLoadingMap);
  }


}
