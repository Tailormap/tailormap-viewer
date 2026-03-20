import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectDataForSelectedTab, selectSelectedTab } from '../state/attribute-list.selectors';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { selectViewerId } from '../../../state';
import { GetStatisticResponse, StatisticType } from '../models/attribute-list-api-service.model';
import { AttributeListStatisticColumnModel } from '../models/attribute-list-statistic-column.model';
import { FilterService } from '../../../filter';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';

interface LoadStatisticParams {
  type: StatisticType;
  columnName: string;
  dataType: string;
  applicationId: string;
  layerId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListStatisticsService {

  private store$ = inject(Store);
  private attributeListManagerService = inject(AttributeListManagerService);
  private filterService = inject(FilterService);

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
          const loadParams: LoadStatisticParams = { type: params.type, columnName: params.columnName, dataType: params.dataType, applicationId, layerId: selectedTab.layerId };
          const key = this.getStatisticsKey(loadParams.applicationId, loadParams.layerId);
          const layerStatistics = this.statistics.value.get(key) || [];
          if (params.type === StatisticType.NONE) {
            this.clearStatistic(layerStatistics, key, params);
          }
          const currentStatistic = layerStatistics?.find(s => {
            return s.dataType === loadParams.dataType && s.columnName === loadParams.columnName && s.type === loadParams.type;
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
      .subscribe((statistic: { params: LoadStatisticParams; response: GetStatisticResponse | null } | null) => {
        if (!statistic || !statistic.params) {
          return;
        }
        this.updateStatistic(statistic);
      });
  }

  private clearStatistic(layerStatistics: AttributeListStatisticColumnModel[], key: string, params: {
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
      column: loadParams.columnName,
      type: loadParams.type,
      filter,
    })
      .pipe(
        take(1),
        map(response => ({ response, params: loadParams })),
        catchError(() => of({ response: null, params: loadParams })),
      );
  }

  private updateStatistic(statistic: { params: LoadStatisticParams; response: GetStatisticResponse | null }) {
    const key = this.getStatisticsKey(statistic.params.applicationId, statistic.params.layerId);
    const currentStatistics = this.statistics.value.get(key) || [];
    const updatedStatisticsForLayer: AttributeListStatisticColumnModel[] = currentStatistics.map(c => {
      if (c.columnName === statistic.params.columnName && c.dataType === statistic.params.dataType && c.type === statistic.params.type) {
        const hasError = !statistic.response || !statistic.response.success;
        const value = statistic.response?.result ?? null;
        return {
          ...c,
          value: hasError ? null : value,
          hasError,
          isLoading: false,
        };
      }
      return c;
    });
    const updatedStatistics = new Map(this.statistics.value);
    updatedStatistics.set(key, updatedStatisticsForLayer);
    this.statistics.next(updatedStatistics);
  }

}
