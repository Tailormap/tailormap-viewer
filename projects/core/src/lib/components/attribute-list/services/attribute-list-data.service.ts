import { Injectable, OnDestroy, inject } from '@angular/core';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { catchError, switchMap, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import {
  combineLatest, debounceTime, filter, groupBy, mergeMap, Observable, of, Subject,
} from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import {
  selectAttributeListDataForId, selectAttributeListRow, selectAttributeListTab, selectAttributeListTabData,
  selectAttributeListTabForDataId, selectAttributeListTabs,
} from '../state/attribute-list.selectors';
import {
  ColumnMetadataModel, FeatureModel, Sortorder, AttributeTypeHelper,
} from '@tailormap-viewer/api';
import { LoadAttributeListDataResultModel } from '../models/load-attribute-list-data-result.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { selectViewerId } from '../../../state/core.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { FilterService } from '../../../filter/services/filter.service';
import * as AttributeListActions from '../state/attribute-list.actions';
import { FeatureUpdatedService } from '../../../services/feature-updated.service';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { selectLayer } from '../../../map';
import { MapService } from '@tailormap-viewer/map';

@Injectable({
  providedIn: 'root',
})
export class AttributeListDataService implements OnDestroy {
  private api = inject(AttributeListManagerService);
  private store$ = inject(Store);
  private filterService = inject(FilterService);
  private featureUpdatedService = inject(FeatureUpdatedService);
  private mapService = inject(MapService);


  private destroyed = new Subject();
  private reloadTabSubject = new Subject<string>();

  public static DEFAULT_ERROR_MESSAGE = $localize `:@@core.attribute-list.failed-loading-data:Failed to load attribute list data`;
  private static FILTER_GEOMETRY_COLUMNS = true;

  constructor() {
    this.registerDataUpdateListener(
      this.filterService.getChangedFilters$(),
      (filters, layerId) => filters.has(layerId),
    );
    this.registerDataUpdateListener(
      this.featureUpdatedService.featureUpdated$,
      (updatedFeature, layerId) => layerId === updatedFeature.layerId,
    );
    this.reloadTabSubject.pipe(
      takeUntil(this.destroyed),
      groupBy(
        tabId => tabId,
        {
          // Added duration to clean up non-existing tab id streams
          duration: group$ => this.store$.select(selectAttributeListTabs).pipe(
            filter(tabs => !tabs.some(tab => tab.id === group$.key)),
          ),
        },
      ),
      mergeMap(tabIds$ => tabIds$.pipe(
        debounceTime(50),
        switchMap(tabId => this.loadDataForTab$(tabId).pipe(map(result => ({ tabId, result })))),
      )),
    ).subscribe(({ tabId, result }) => {
      if (!result.success) {
        this.store$.dispatch(AttributeListActions.loadDataFailed({ tabId, data: result }));
      } else {
        this.store$.dispatch(AttributeListActions.loadDataSuccess({ tabId, data: result }));
      }
    });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public loadData(tabId: string): void {
    this.store$.dispatch(AttributeListActions.loadData({ tabId }));
    this.reloadTabData(tabId);
  }

  public updatePage(dataId: string, page: number): void {
    this.store$.dispatch(AttributeListActions.updatePage({ dataId, page }));
    this.reloadDataForId(dataId);
  }

  public updateSort(dataId: string, column: string, direction: 'asc' | 'desc' | ''): void {
    this.store$.dispatch(AttributeListActions.updateSort({ dataId, column, direction }));
    this.reloadDataForId(dataId);
  }

  public updateRowSelected(dataId: string, rowId: string, selected: boolean): void {
    this.store$.dispatch(AttributeListActions.updateRowSelected({ dataId, rowId, selected }));
    if (selected) {
      this.notifyRowSelected(dataId, rowId);
    }
  }

  public updateRowChecked(tabId: string, dataId: string, rowId: string, checked: boolean): void {
    this.store$.dispatch(AttributeListActions.updateRowChecked({ tabId, dataId, rowId, checked }));
    this.notifyCheckedRowsChanged(dataId);
  }

  public updateAllRowsChecked(tabId: string, dataId: string, checked: boolean): void {
    this.store$.dispatch(AttributeListActions.updateAllRowsChecked({ tabId, dataId, checked }));
    this.notifyCheckedRowsChanged(dataId);
  }

  private reloadTabData(tabId: string): void {
    this.reloadTabSubject.next(tabId);
  }

  private reloadDataForId(dataId: string): void {
    this.store$.select(selectAttributeListDataForId(dataId))
      .pipe(take(1))
      .subscribe(data => {
        if (data) {
          this.reloadTabData(data.tabId);
        }
      });
  }

  private notifyRowSelected(dataId: string, rowId: string): void {
    combineLatest([
      this.store$.select(selectAttributeListTabForDataId(dataId)),
      this.store$.select(selectAttributeListRow(dataId, rowId)),
      this.store$.select(selectViewerId),
      this.mapService.getProjectionCode$(),
    ]).pipe(
      take(1),
      switchMap(([ tab, row, applicationId ]) => this.store$.select(selectLayer(tab?.layerId || ''))
        .pipe(take(1), map(layer => ({ tab, row, applicationId, layer })))),
    ).subscribe(({ tab, row, applicationId, layer }) => {
      if (!tab || !row || !row.__fid || !tab.layerId || applicationId === null || !layer) {
        return;
      }
      this.api.getFeatures$(tab.tabSourceId, {
        applicationId,
        layerId: tab.layerId,
        layerName: layer.layerName || '',
        __fid: row.__fid,
      }).pipe(take(1)).subscribe(result => {
        const feature = result.features && result.features.length > 0
          ? { ...result.features[0], tabId: tab.id }
          : null;
        this.store$.dispatch(AttributeListActions.setHighlightedFeature({ feature }));
      });
    });
  }

  private notifyCheckedRowsChanged(dataId: string): void {
    combineLatest([
      this.store$.select(selectAttributeListDataForId(dataId)),
      this.store$.select(selectAttributeListTabForDataId(dataId)),
      this.store$.select(selectViewerId),
    ]).pipe(take(1)).subscribe(([ data, tab, applicationId ]) => {
      if (!data || !tab || !tab.layerId || applicationId === null) {
        return;
      }
      this.api.notifyCheckedRowsChanged(tab.tabSourceId, {
        applicationId,
        layerId: tab.layerId,
        checkedRows: data.checkedRows.filter(r => !!r.__fid).map(r => ({ __fid: r.__fid })),
      });
    });
  }

  public loadDataForTab$(tabId: string): Observable<LoadAttributeListDataResultModel> {
    return combineLatest([
      this.store$.select(selectAttributeListTab(tabId)),
      this.store$.select(selectAttributeListTabData(tabId)),
    ]).pipe(
      take(1),
      switchMap(([ tab, data ]) => {
        if (!tab || !tab.layerId) {
          return of(AttributeListDataService.getErrorResult(''));
        }
        return this.loadData$(tab, tab.selectedDataId, data);
      }),
    );
  }

  private loadData$(
    tab: AttributeListTabModel,
    dataId: string,
    data: AttributeListDataModel[],
  ): Observable<LoadAttributeListDataResultModel> {
    if (!tab.layerId) {
      return of(AttributeListDataService.getErrorResult(dataId));
    }
    const layerId = tab.layerId;
    const selectedData = data.find(d => d.id === dataId);
    if (!selectedData) {
      return of(AttributeListDataService.getErrorResult(dataId));
    }
    const start = selectedData.pageIndex;
    const layerFilter = this.filterService.getFilterForLayer(layerId);
    return combineLatest([ this.store$.select(selectViewerId), this.store$.select(selectLayer((layerId))) ])
      .pipe(
        filter((result): result is [ NonNullable<typeof result[0]>, NonNullable<typeof result[1]> ] => {
          const [ applicationId, layer ] = result;
          return TypesHelper.isDefined(applicationId) && TypesHelper.isDefined(layer);
        }),
        take(1),
        switchMap(([ applicationId, layer ]) => this.api.getFeatures$(tab.tabSourceId, {
          layerId,
          applicationId: applicationId,
          layerName: layer.layerName,
          page: start,
          filter: layerFilter,
          sortBy: selectedData.sortedColumn,
          sortOrder: selectedData.sortDirection === 'desc'
            ? Sortorder.DESC
            : (selectedData.sortDirection === 'asc' ? Sortorder.ASC : undefined),
        })),
      catchError(_e => of(null)),
      map((response): LoadAttributeListDataResultModel => {
        if (response === null) {
          // eslint-disable-next-line max-len
          return AttributeListDataService.getErrorResult(selectedData.id, $localize `:@@core.attribute-list.failed-loading-data-for:Failed to load attribute list data for ${tab.label}`);
        }
        return {
          id: selectedData.id,
          totalCount: response.total,
          success: true,
          columns: AttributeListDataService.getColumns(response.columnMetadata),
          rows: AttributeListDataService.decorateFeatures(response.features, selectedData),
          pageSize: response.pageSize || selectedData.pageSize,
          pageIndex: response.page === null || typeof response.page === 'undefined' ? undefined : response.page,
        };
      }),
    );
  }

  private static decorateFeatures(
    features: FeatureModel[],
    data: AttributeListDataModel,
  ): AttributeListRowModel[] {
    return features.map<AttributeListRowModel>((feature, idx) => {
      const rowId = feature.__fid ? `${feature.__fid}` : `${data.id}_${data.pageIndex}_${idx}`;
      return {
        id: rowId,
        __fid: feature.__fid,
        attributes: feature.attributes,
      };
    });
  }

  private static getColumns(columnMetadata: ColumnMetadataModel[]): AttributeListColumnModel[] {
    return columnMetadata
      .filter(column => {
        if (!AttributeListDataService.FILTER_GEOMETRY_COLUMNS) {
          return true;
        }
        return !AttributeTypeHelper.isGeometryType(column.type);
      })
      .map<AttributeListColumnModel>(column => ({
        id: column.name,
        visible: true,
        type: column.type,
        label: column.alias || column.name,
      }));
  }

  private static getErrorResult(id: string, message?: string): LoadAttributeListDataResultModel {
    return {
      id,
      totalCount: 0,
      rows: [],
      columns: [],
      success: false,
      errorMessage: message || AttributeListDataService.DEFAULT_ERROR_MESSAGE,
      pageSize: 0,
    };
  }

  private registerDataUpdateListener<T>(source$: Observable<T>, shouldUpdateTab: (sourceResult: T, layerId: string) => boolean) {
    source$
      .pipe(
        takeUntil(this.destroyed),
        withLatestFrom(this.store$.select(selectAttributeListTabs)),
        map(([ sourceResult, tabs ]) => {
          return tabs.filter(tab => typeof tab.layerId === 'undefined' ? false : shouldUpdateTab(sourceResult, tab.layerId));
        }),
      )
      .subscribe(tabs => {
        this.store$.dispatch(AttributeListActions.setHighlightedFeature({ feature: null }));
        tabs.forEach(tab => {
          // After changes, reset the page index because the number of results may have changed
          this.store$.dispatch(AttributeListActions.updatePage({ dataId: tab.selectedDataId, page: 1 }));
          this.reloadTabData(tab.id);
        });
      });
  }

}
