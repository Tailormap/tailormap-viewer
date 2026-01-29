import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { concatMap, map, switchMap } from 'rxjs/operators';
import { forkJoin, Observable, of, pipe, take, combineLatest } from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import {
  selectColumnsForSelectedTab, selectDataForSelectedTab, selectHasNoRowsForSelectedTab, selectLoadErrorForSelectedTab,
  selectLoadingDataSelectedTab,
  selectRowCountForSelectedTab,
  selectRowsForSelectedTab, selectSelectedRowIdForSelectedTab, selectSelectedTab, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { loadData, updateRowSelected, updateSort } from '../state/attribute-list.actions';
import { AttributeListStateService } from '../services/attribute-list-state.service';
import { BaseComponentTypeEnum, AttributeType, AttributeFilterModel } from '@tailormap-viewer/api';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { AttributeListFilterComponent, FilterDialogData } from '../attribute-list-filter/attribute-list-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { selectViewerId } from '../../../state/core.selectors';
import { CqlFilterHelper } from '../../../filter/helpers/cql-filter.helper';
import { CssHelper } from '@tailormap-viewer/shared';
import { AttributeListFeatureDetailsService } from '../services/attribute-list-feature-details.service';

@Component({
  selector: 'tm-attribute-list-content',
  templateUrl: './attribute-list-content.component.html',
  styleUrls: ['./attribute-list-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListContentComponent implements OnInit {
  private store$ = inject(Store);
  private attributeListStateService = inject(AttributeListStateService);
  private attributeListFeatureDetailsService = inject(AttributeListFeatureDetailsService);
  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);
  private dialog = inject(MatDialog);

  public rows$: Observable<AttributeListRowModel[]> = of([]);
  public columns$: Observable<AttributeListColumnModel[]> = of([]);
  public notLoadingData$: Observable<boolean> = of(false);
  public sort$: Observable<{ column: string; direction: string } | null> = of(null);
  public filters$: Observable<AttributeFilterModel[]> = of([]);
  public selectedRowId$: Observable<string | undefined> = of(undefined);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public hasRows$: Observable<boolean> = of(false);
  public hasNoRows$: Observable<boolean> = of(true);

  public canExpandRows$ = this.attributeListFeatureDetailsService.canExpandRows$;
  public featureDetails$ = this.attributeListFeatureDetailsService.featureDetails$;
  public loadingFeatureDetailsIds$ = this.attributeListFeatureDetailsService.loadingFeatureDetailsIds$;

  public ngOnInit(): void {
    this.errorMessage$ = this.store$.select(selectLoadErrorForSelectedTab);
    this.rows$ = this.store$.select(selectRowsForSelectedTab);
    this.sort$ = this.store$.select(selectSortForSelectedTab);
    this.hasRows$ = this.store$.select(selectRowCountForSelectedTab).pipe(map(rowCount => rowCount > 0));
    this.hasNoRows$ = this.store$.select(selectHasNoRowsForSelectedTab);
    this.columns$ = this.store$.select(selectColumnsForSelectedTab);
    this.notLoadingData$ = this.store$.select(selectLoadingDataSelectedTab).pipe(map(loading => !loading));
    this.filters$ = this.store$.select(selectSelectedTab)
      .pipe(switchMap(tab => {
        if (!tab || !tab.layerId) {
          return of([]);
        }
        return this.simpleAttributeFilterService.getFilters$(BaseComponentTypeEnum.ATTRIBUTE_LIST, tab.layerId);
      }));
    this.selectedRowId$ = this.store$.select(selectSelectedRowIdForSelectedTab);
  }

  public onSelectRow(row: { id: string; selected: boolean }): void {
    this.attributeListStateService.executeActionForCurrentData(dataId => {
      this.store$.dispatch(updateRowSelected({
        dataId,
        rowId: row.id,
        selected: row.selected,
      }));
    });
  }

  public onSortClick(sort: { columnId: string; direction: 'asc' | 'desc' | '' }): void {
    this.attributeListStateService.executeActionForCurrentData(dataId => {
      this.store$.dispatch(updateSort({
        dataId,
        column: sort.columnId,
        direction: sort.direction,
      }));
    });
  }

  public onSetFilter($event: { columnId: string; attributeType: AttributeType }) {
    combineLatest([
      this.store$.select(selectSelectedTab),
      this.store$.select(selectDataForSelectedTab),
      this.store$.select(selectViewerId),
    ])
      .pipe(
        pipe(take(1)),
        concatMap(([ selectedTab, selectedData, applicationId ]) => {
          if (!selectedTab || !selectedTab.layerId) {
            return of(null);
          }
          return forkJoin([
            this.simpleAttributeFilterService.getFilterForAttribute$(
              BaseComponentTypeEnum.ATTRIBUTE_LIST,
              selectedTab.layerId,
              $event.columnId,
              selectedData?.featureType,
            ).pipe(take(1)),
            this.simpleAttributeFilterService.getFiltersExcludingAttribute$(
              BaseComponentTypeEnum.ATTRIBUTE_LIST,
              selectedTab.layerId,
              $event.columnId,
              selectedData?.featureType,
            ).pipe(take(1)),
            of(selectedTab),
            of(selectedData),
            of(applicationId),
            this.columns$.pipe(
              take(1),
              map(columns => columns.find(col => col.id === $event.columnId)?.label || undefined),
            ),
          ]);
        }),
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        const [ attributeFilterModel, otherFilters, selectedTab, selectedData, applicationId, attributeAlias ] = result;
        if (applicationId === null || !selectedTab.layerId) {
          return;
        }
        const filtersForLayer = CqlFilterHelper.getFilters(otherFilters).get(selectedTab.layerId);
        const data: FilterDialogData = {
          tabSourceId: selectedTab.tabSourceId,
          columnName: $event.columnId,
          layerId: selectedTab.layerId,
          filter: attributeFilterModel,
          columnType: $event.attributeType,
          cqlFilters: filtersForLayer,
          applicationId,
          attributeAlias,
          featureType: selectedData?.featureType,
        };
        this.dialog.open(AttributeListFilterComponent, { data, maxHeight: CssHelper.MAX_SCREEN_HEIGHT });
      });
  }

  public reloadData() {
    this.store$.select(selectSelectedTab)
      .pipe(take(1))
      .subscribe(tab => {
        if (!tab || !tab.layerId) {
          return;
        }
        this.store$.dispatch(loadData({ tabId: tab.id }));
      });
  }

  public loadFeatureDetailsForFeature($event: string) {
    this.attributeListFeatureDetailsService.loadFeatureDetailsForFeature($event);
  }

}
