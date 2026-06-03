import { DestroyRef, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectAttributeListTabs, selectDataForSelectedTab, selectSelectedTab } from '../state/attribute-list.selectors';
import { catchError, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { selectViewerId } from '../../../state';
import { GetStatisticResponse, StatisticType } from '../models/attribute-list-api-service.model';
import { AttributeListStatisticColumnModel } from '../models/attribute-list-statistic-column.model';
import { FilterService, LayerFeaturesFilters } from '../../../filter';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface StatisticParam {
  type: StatisticType;
  column: string;
  dataType: string;
}

interface LoadStatisticParams {
  applicationId: string;
  layerId: string;
  statistics: StatisticParam[];
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListStatisticsService {

  private store$ = inject(Store);
  private attributeListManagerService = inject(AttributeListManagerService);
  private filterService = inject(FilterService);
  private destroyRef = inject(DestroyRef);

  public canLoadStatistics$ = combineLatest([
    this.store$.select(selectViewerId),
    this.store$.select(selectSelectedTab),
  ]).pipe(
    map(([ applicationId, tab ]): boolean => {
      if (!applicationId || !tab || !tab.layerId) {
        return false;
      }
      return this.attributeListManagerService.canLoadStatistics(tab.tabSourceId);
    }),
  );

  private statisticsKey$ = combineLatest([ this.store$.select(selectViewerId), this.store$.select(selectSelectedTab) ]).pipe(
    map(([ applicationId, tab ]) => {
      if (!applicationId || !tab || !tab.layerId) {
        return null;
      }
      return this.getStatisticsKey(applicationId, tab.layerId);
    }),
  );

  private statistics = new BehaviorSubject<Map<string, AttributeListStatisticColumnModel[]>>(new Map());

  public statistics$ = combineLatest([
    this.statistics.asObservable(),
    this.statisticsKey$,
  ]).pipe(map(([ statisticsMap, key ]): AttributeListStatisticColumnModel[] => {
    return statisticsMap.get(key ?? '') || [];
  }));

  constructor() {
    this.filterService.getChangedFilters$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(this.store$.select(selectViewerId), this.store$.select(selectAttributeListTabs)),
      )
      .subscribe(([ changedFilters, viewerId, tabs ]) => {
        if (!tabs || tabs.length === 0 || !viewerId) {
          return;
        }
        const changedLayers = Array.from(changedFilters.keys());
        changedLayers.forEach(layerId => {
          const tab = tabs.find(t => t.layerId === layerId);
          if (!tab) {
            return;
          }
          const key = this.getStatisticsKey(viewerId, layerId);
          const filter = changedFilters.get(layerId);
          const currentStatistics = this.statistics.value.get(key) || [];
          if (currentStatistics.length === 0) {
            return;
          }
          const updatedStatistics = currentStatistics.map(statistic => ({
            ...statistic,
            isLoading: true,
          }));
          const updatedMap = new Map(this.statistics.value);
          updatedMap.set(key, updatedStatistics);
          this.statistics.next(updatedMap);
          this.refreshStatistics$({ key, viewerId, layerId, tabSourceId: tab.tabSourceId, statistics: currentStatistics, filter });
        });
      });
  }

  private getStatisticsKey(applicationId: string, layerId: string) {
    return `${applicationId}_${layerId}`;
  }

  public loadStatistics(params: { type: StatisticType; columnName: string; dataType: string }) {
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
          const loadParams: LoadStatisticParams = {
            statistics: [{
              type: params.type,
              column: params.columnName,
              dataType: params.dataType,
            }],
            applicationId,
            layerId: selectedTab.layerId,
          };
          const key = this.getStatisticsKey(loadParams.applicationId, loadParams.layerId);
          const layerStatistics = this.statistics.value.get(key) || [];
          if (params.type === StatisticType.NONE) {
            return this.clearStatistic$(layerStatistics, key, params);
          }
          const currentStatistic = layerStatistics?.find(s => {
            return s.dataType === params.dataType && s.columnName === params.columnName && s.type === params.type;
          });
          if (currentStatistic) {
            // already loaded
            return of(null);
          }
          // Remove any previous statistic for the same column and data type
          const filteredLayerStatistics = (layerStatistics || []).filter(statistic => {
            return !(statistic.columnName === params.columnName && statistic.dataType === params.dataType);
          });
          const updatedStatistics = new Map(this.statistics.value);
          updatedStatistics.set(key, [
            ...filteredLayerStatistics,
            { columnName: params.columnName, dataType: params.dataType, type: params.type, isLoading: true, value: null },
          ]);
          this.statistics.next(updatedStatistics);
          return this.fetchStatistic$(loadParams, selectedTab);
        }),
      )
      .subscribe((statistic: { applicationId: string; layerId: string; response: GetStatisticResponse | null } | null) => {
        if (!statistic) {
          return;
        }
        this.updateStatistic(statistic);
      });
  }

  private clearStatistic$(layerStatistics: AttributeListStatisticColumnModel[], key: string, params: {
    type: StatisticType;
    columnName: string;
    dataType: string;
  }) {
    const updatedStatistics = layerStatistics.filter(statistic => {
      return !(statistic.columnName === params.columnName && statistic.dataType === params.dataType);
    });
    if (updatedStatistics.length !== layerStatistics.length) {
      const updatedMap = new Map(this.statistics.value);
      updatedMap.set(key, updatedStatistics);
      this.statistics.next(updatedMap);
    }
    return of(null);
  }

  private fetchStatistic$(loadParams: LoadStatisticParams, selectedTab: AttributeListTabModel) {
    const filter = this.filterService.getFilterForLayer(loadParams.layerId);
    return this.attributeListManagerService.getStatistic$(selectedTab.tabSourceId, {
      applicationId: loadParams.applicationId,
      layerId: loadParams.layerId,
      statistics: loadParams.statistics,
      filter,
    })
      .pipe(
        take(1),
        map(response => ({ response, applicationId: loadParams.applicationId, layerId: loadParams.layerId  })),
        catchError(() => of({ response: null, applicationId: loadParams.applicationId, layerId: loadParams.layerId  })),
      );
  }

  private refreshStatistics$(params: {
    key: string;
    viewerId: string;
    layerId: string;
    tabSourceId: string;
    statistics: AttributeListStatisticColumnModel[];
    filter: LayerFeaturesFilters | null | undefined;
  }) {
    return this.attributeListManagerService.getStatistic$(params.tabSourceId, {
      applicationId: params.viewerId,
      layerId: params.layerId,
      statistics: params.statistics.map(s => ({
        column: s.columnName,
        type: s.type,
      })),
      filter: params.filter,
    })
      .pipe(
        take(1),
        catchError(() => of(null)),
      )
      .subscribe(response => {
        this.updateStatistic({ applicationId: params.viewerId, layerId: params.layerId, response });
      });
  }

  private updateStatistic(statistic: { applicationId: string; layerId: string; response: GetStatisticResponse | null }) {
    const key = this.getStatisticsKey(statistic.applicationId, statistic.layerId);
    const currentStatistics = this.statistics.value.get(key) || [];
    const updatedStatisticsForLayer: AttributeListStatisticColumnModel[] = currentStatistics.map(c => {
      const resultItem = statistic.response?.result.find(r => c.columnName === r.column && c.type === r.type);
      if (resultItem === undefined) {
        return c;
      }
      const hasError = !statistic.response || !statistic.response.success;
      return {
        ...c,
        value: hasError ? null : resultItem.value,
        hasError,
        isLoading: false,
      };
    });
    const updatedStatistics = new Map(this.statistics.value);
    updatedStatistics.set(key, updatedStatisticsForLayer);
    this.statistics.next(updatedStatistics);
  }

}
