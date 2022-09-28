import { Inject, Injectable, OnDestroy } from '@angular/core';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { catchError, concatMap, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { combineLatest, filter, Observable, of, Subject } from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import { selectAttributeListTab, selectAttributeListTabData, selectAttributeListTabs } from '../state/attribute-list.selectors';
import { ColumnMetadataModel, FeatureModel, Sortorder, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { LoadAttributeListDataResultModel } from '../models/load-attribute-list-data-result.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { selectApplicationId } from '../../../state/core.selectors';
import { TypesHelper } from '@tailormap-viewer/shared';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { FilterService } from '../../../filter/services/filter.service';
import * as AttributeListActions from '../state/attribute-list.actions';
import { setHighlightedFeature } from '../state/attribute-list.actions';

@Injectable({
  providedIn: 'root',
})
export class AttributeListDataService implements OnDestroy {

  private destroyed = new Subject();

  public static DEFAULT_ERROR_MESSAGE = $localize `Failed to load attribute list data`;

  constructor(
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
    private store$: Store,
    private filterService: FilterService,
  ) {
    this.filterService.getChangedFilters$()
      .pipe(
        takeUntil(this.destroyed),
        withLatestFrom(this.store$.select(selectAttributeListTabs)),
        map(([ filters, tabs ]) => {
          return tabs.filter(tab => typeof tab.layerId === 'undefined' ? false : filters.has(tab.layerId));
        }),
      )
      .subscribe(tabs => {
        tabs.forEach(tab => {
          this.store$.dispatch(AttributeListActions.setHighlightedFeature({ feature: null }));
          this.store$.dispatch(AttributeListActions.loadData({ tabId: tab.id }));
        });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public loadDataForTab$(tabId: string): Observable<LoadAttributeListDataResultModel> {
    return combineLatest([
      this.store$.select(selectAttributeListTab(tabId)),
      this.store$.select(selectAttributeListTabData(tabId)),
    ]).pipe(
      take(1),
      concatMap(([ tab, data ]) => {
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
    return this.store$.select(selectApplicationId)
      .pipe(
        filter(TypesHelper.isDefined),
        concatMap(applicationId => this.api.getFeatures$({
          layerId,
          applicationId,
          page: start,
          filter: layerFilter,
          sortBy: selectedData.sortedColumn,
          sortOrder: selectedData.sortDirection === 'desc'
            ? Sortorder.DESC
            : (selectedData.sortDirection === 'asc' ? Sortorder.ASC : undefined),
        })),
      ).pipe(
      catchError(() => of(null)),
      map((response): LoadAttributeListDataResultModel => {
        if (response === null) {
          return AttributeListDataService.getErrorResult(selectedData.id);
        }
        return {
          id: selectedData.id,
          totalCount: response.total,
          success: true,
          columns: AttributeListDataService.getColumns(response.columnMetadata),
          rows: AttributeListDataService.decorateFeatures(response.features, selectedData),
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
        selected: false,
        attributes: feature.attributes,
      };
    });
  }

  private static getColumns(columnMetadata: ColumnMetadataModel[]): AttributeListColumnModel[] {
    return columnMetadata.map<AttributeListColumnModel>(column => ({
      id: column.key,
      visible: true,
      type: column.type,
      label: column.alias || column.key,
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
    };
  }

}
