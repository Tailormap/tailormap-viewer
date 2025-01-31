import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { concatMap, map, switchMap } from 'rxjs/operators';
import { forkJoin, Observable, of, pipe, take, combineLatest } from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import {
  selectColumnsForSelectedTab, selectHasNoRowsForSelectedTab, selectLoadErrorForSelectedTab, selectLoadingDataSelectedTab,
  selectRowCountForSelectedTab,
  selectRowsForSelectedTab, selectSelectedRowIdForSelectedTab, selectSelectedTab, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { loadData, updateRowSelected, updateSort } from '../state/attribute-list.actions';
import { AttributeListStateService } from '../services/attribute-list-state.service';
import { BaseComponentTypeEnum, AttributeType } from '@tailormap-viewer/api';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { AttributeListFilterComponent, FilterDialogData } from '../attribute-list-filter/attribute-list-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { AttributeFilterModel } from '../../../filter/models/attribute-filter.model';
import { selectViewerId } from '../../../state/core.selectors';
import { CqlFilterHelper } from '../../../filter/helpers/cql-filter.helper';
import { CssHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-attribute-list-content',
  templateUrl: './attribute-list-content.component.html',
  styleUrls: ['./attribute-list-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListContentComponent implements OnInit {

  public rows$: Observable<AttributeListRowModel[]> = of([]);
  public columns$: Observable<AttributeListColumnModel[]> = of([]);
  public notLoadingData$: Observable<boolean> = of(false);
  public sort$: Observable<{ column: string; direction: string } | null> = of(null);
  public filters$: Observable<AttributeFilterModel[]> = of([]);
  public selectedRowId$: Observable<string | undefined> = of(undefined);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public hasRows$: Observable<boolean> = of(false);
  public hasNoRows$: Observable<boolean> = of(true);

  private store$ = inject(Store);
  private attributeListStateService = inject(AttributeListStateService);
  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);
  private dialog = inject(MatDialog);

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
      this.store$.select(selectViewerId),
    ])
      .pipe(
        pipe(take(1)),
        concatMap(([ selectedTab, applicationId ]) => {
          if (!selectedTab || !selectedTab.layerId) {
            return of(null);
          }
          const layerId = selectedTab.layerId;
          return forkJoin([
            this.simpleAttributeFilterService.getFilterForAttribute$(BaseComponentTypeEnum.ATTRIBUTE_LIST, layerId, $event.columnId).pipe(take(1)),
            this.simpleAttributeFilterService.getFiltersExcludingAttribute$(BaseComponentTypeEnum.ATTRIBUTE_LIST, layerId, $event.columnId).pipe(take(1)),
            of(layerId),
            of(applicationId),
          ]);
        }),
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        const [ attributeFilterModel, otherFilters, layerId, applicationId ] = result;
        if (applicationId === null) {
          return;
        }
        const data: FilterDialogData = {
          columnName: $event.columnId,
          layerId,
          filter: attributeFilterModel,
          columnType: $event.attributeType,
          cqlFilter: CqlFilterHelper.getFilters(otherFilters).get(layerId),
          applicationId,
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

}
