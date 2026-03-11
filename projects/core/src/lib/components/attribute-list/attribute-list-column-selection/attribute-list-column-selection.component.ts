import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { changeColumnPosition, toggleAllColumnsVisible, toggleColumnVisible } from '../state/attribute-list.actions';
import { OVERLAY_DATA, OverlayRef } from '@tailormap-viewer/shared';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { selectSelectedColumnsForData } from '../state/attribute-list.selectors';
import { map } from 'rxjs';

@Component({
  selector: 'tm-attribute-list-column-selection',
  templateUrl: './attribute-list-column-selection.component.html',
  styleUrls: ['./attribute-list-column-selection.component.css'],
  standalone: false,
})
export class AttributeListColumnSelectionComponent {

  private store$ = inject(Store);
  private overlayRef = inject(OverlayRef);
  private data = inject(OVERLAY_DATA) as { dataId: string };
  public columns$ = this.store$.select(selectSelectedColumnsForData(this.data.dataId));
  public allColumnsVisible$ = this.columns$.pipe(map(columns => columns.every(column => column.visible)));
  public someColumnsVisible$ = this.columns$.pipe(map(columns => columns.some(column => column.visible)));

  public closeOverlay() {
    this.overlayRef.close();
  }

  public trackByColumnId(index: number, column: AttributeListColumnModel) {
    return column.id;
  }

  public toggleVisible(column: AttributeListColumnModel) {
    this.store$.dispatch(toggleColumnVisible({
      dataId: this.data.dataId,
      columnId: column.id,
    }));
  }

  public drop($event: CdkDragDrop<AttributeListColumnModel>, columns: AttributeListColumnModel[]) {
    const tempColumns = [...columns];
    moveItemInArray(tempColumns, $event.previousIndex, $event.currentIndex);
    const prevItem = $event.currentIndex === 0 ? null : tempColumns[$event.currentIndex - 1].id;
    this.store$.dispatch(changeColumnPosition({
      dataId: this.data.dataId,
      columnId: $event.item.data.id,
      previousColumn: prevItem,
    }));
  }

  public toggleSelectAll() {
    this.store$.dispatch(toggleAllColumnsVisible({ dataId: this.data.dataId }));
  }

}
