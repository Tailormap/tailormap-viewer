import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectDataForSelectedTab, selectSelectedTab } from '../state/attribute-list.selectors';
import { map, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { selectViewerId } from '../../../state';
import { GetStatisticResponse, StatisticType } from '../models/attribute-list-api-service.model';
import { AttributeListStatisticColumnModel } from '../models/attribute-list-statistic-column.model';
import { FilterService } from '../../../filter';

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
  ]).pipe(map(([ featureDetailsMap, key ]): AttributeListStatisticColumnModel[] => {
    return featureDetailsMap.get(key ?? '') || [];
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
          const loadParams = { type: params.type, columnName: params.columnName, dataType: params.dataType, applicationId, layerId: selectedTab.layerId };
          const key = this.getStatisticsKey(loadParams.applicationId, loadParams.layerId);
          const layerStatistics = this.statistics.value.get(key);
          const currentStatistic = layerStatistics?.find(s => {
            return s.dataType === loadParams.dataType && s.columnName === loadParams.columnName && s.type === loadParams.type;
          });
          if (currentStatistic) {
            // already loaded
            return of(null);
          }
          this.statistics.next(this.statistics.value.set(key, [
            ...(layerStatistics || []),
            { columnName: params.columnName, dataType: params.dataType, type: params.type, isLoading: true, value: 0 },
          ]));
          const filter = this.filterService.getFilterForLayer(loadParams.layerId);
          return this.attributeListManagerService.getStatistic$(selectedTab.tabSourceId, {
            applicationId: loadParams.applicationId,
            layerId: loadParams.layerId,
            column: loadParams.columnName,
            type: loadParams.type,
            filter,
          })
            .pipe(take(1), map(response => ({ response, params: loadParams } )));
        }),
      )
      .subscribe((statistic: { params: LoadStatisticParams; response: GetStatisticResponse | null } | null) => {
        if (!statistic || !statistic.params) {
          return;
        }
        const key = this.getStatisticsKey(statistic.params.applicationId, statistic.params.layerId);
        const currentStatistics = this.statistics.value.get(key) || [];
        currentStatistics.map(c => {
          if (c.columnName === statistic.params.columnName && c.dataType === statistic.params.dataType && c.type === statistic.params.type) {
            const hasError = !statistic.response || !statistic.response.success;
            const value = statistic.response?.result ?? 0;
            c.value = hasError ? 0 : value;
            c.hasError = hasError;
            c.isLoading = false;
          }
          return c;
        });
        this.statistics.next(this.statistics.value.set(key, currentStatistics));
      });
  }

}
