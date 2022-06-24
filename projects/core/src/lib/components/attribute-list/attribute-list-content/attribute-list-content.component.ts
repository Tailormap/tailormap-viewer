import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { Store } from '@ngrx/store';
import { AttributeListState } from '../state/attribute-list.state';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import {
  selectColumnsForSelectedTab, selectLoadingDataSelectedTab,
  selectRowCountForSelectedTab,
  selectRowsForSelectedTab, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { updateRowSelected } from '../state/attribute-list.actions';
import { AttributeListStateService } from '../services/attribute-list-state.service';

@Component({
  selector: 'tm-attribute-list-content',
  templateUrl: './attribute-list-content.component.html',
  styleUrls: ['./attribute-list-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListContentComponent implements OnInit {

  public rows$: Observable<AttributeListRowModel[]> = of([]);
  public columns$: Observable<AttributeListColumnModel[]> = of([]);
  public loadingData$: Observable<boolean> = of(true);
  public notLoadingData$: Observable<boolean> = of(false);
  public sort$: Observable<{ column: string; direction: string } | null> = of(null);
  public hasRows$: Observable<boolean> = of(false);
  public hasNoRows$: Observable<boolean> = of(true);

  constructor(
    private store$: Store<AttributeListState>,
    private attributeListStateService: AttributeListStateService,
  ) { }

  public ngOnInit(): void {
    this.rows$ = this.store$.select(selectRowsForSelectedTab);
    this.sort$ = this.store$.select(selectSortForSelectedTab);
    this.hasRows$ = this.store$.select(selectRowCountForSelectedTab).pipe(map(rowCount => rowCount > 0));
    this.hasNoRows$ = this.hasRows$.pipe(map(hasRows => !hasRows));
    this.columns$ = this.store$.select(selectColumnsForSelectedTab);
    this.loadingData$ = this.store$.select(selectLoadingDataSelectedTab);
    this.notLoadingData$ = this.loadingData$.pipe(map(loading => !loading));
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

}
