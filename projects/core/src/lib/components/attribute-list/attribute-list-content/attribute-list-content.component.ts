import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { concatMap, map } from 'rxjs/operators';
import { forkJoin, Observable, of, pipe, take } from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import { AttributeListState } from '../state/attribute-list.state';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import {
  selectColumnsForSelectedTab, selectLoadingDataSelectedTab,
  selectRowCountForSelectedTab,
  selectRowsForSelectedTab, selectSelectedTab, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { updateRowSelected, updateSort } from '../state/attribute-list.actions';
import { AttributeListStateService } from '../services/attribute-list-state.service';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { selectCQLFilters } from '../../../filter/state/filter.selectors';
import { ATTRIBUTE_LIST_ID } from '../attribute-list-identifier';
import { AttributeListFilterComponent, FilterDialogData } from '../attribute-list-filter/attribute-list-filter.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'tm-attribute-list-content',
  templateUrl: './attribute-list-content.component.html',
  styleUrls: ['./attribute-list-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListContentComponent implements OnInit {

  public rows$: Observable<AttributeListRowModel[]> = of([]);
  public columns$: Observable<AttributeListColumnModel[]> = of([]);
  public notLoadingData$: Observable<boolean> = of(false);
  public sort$: Observable<{ column: string; direction: string } | null> = of(null);
  public hasRows$: Observable<boolean> = of(false);
  public hasNoRows$: Observable<boolean> = of(true);

  private store$ = inject(Store);
  private attributeListStateService = inject(AttributeListStateService);
  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);
  private dialog = inject(MatDialog);

  public ngOnInit(): void {
    this.rows$ = this.store$.select(selectRowsForSelectedTab);
    this.sort$ = this.store$.select(selectSortForSelectedTab);
    this.hasRows$ = this.store$.select(selectRowCountForSelectedTab).pipe(map(rowCount => rowCount > 0));
    this.hasNoRows$ = this.hasRows$.pipe(map(hasRows => !hasRows));
    this.columns$ = this.store$.select(selectColumnsForSelectedTab);
    this.notLoadingData$ = this.store$.select(selectLoadingDataSelectedTab).pipe(map(loading => !loading));
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

  public onSetFilter($event: { columnId: string; attributeType: FeatureAttributeTypeEnum }) {
    this.store$.select(selectSelectedTab)
      .pipe(
        pipe(take(1)),
        concatMap(selectedTab => {
          if (!selectedTab || !selectedTab.layerId) {
            return of(null);
          }
          const layerId = selectedTab.layerId;
          return forkJoin([
            this.simpleAttributeFilterService.getFilter(ATTRIBUTE_LIST_ID, layerId, $event.columnId),
            this.store$.select(selectCQLFilters)
              .pipe(take(1), map(cqlFilters => cqlFilters.get(layerId))),
            of(layerId),
          ]);
        }),
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        const [ attributeFilterModel, cqlFilter, layerId ] = result;
        const data: FilterDialogData = {
          columnName: $event.columnId,
          layerId,
          filter: attributeFilterModel,
          columnType: $event.attributeType,
          cqlFilter,
        };
        this.dialog.open(AttributeListFilterComponent, { data });
      });
  }
}
