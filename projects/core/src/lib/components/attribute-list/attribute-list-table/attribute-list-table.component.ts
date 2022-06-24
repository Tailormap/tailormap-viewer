import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';

const DEFAULT_COLUMN_WIDTH = 170;

@Component({
  selector: 'tm-attribute-list-table',
  templateUrl: './attribute-list-table.component.html',
  styleUrls: ['./attribute-list-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListTableComponent {

  @Input()
  public set rows(rows: AttributeListRowModel[] | null) {
    if (rows === null) {
      return;
    }
    this._rows = rows;
  }

  public get rows(): AttributeListRowModel[] {
    return this._rows;
  }

  @Input()
  public set columns(columns: AttributeListColumnModel[] | null) {
    if (columns === null) {
      return;
    }
    this._columns = columns;
    this.columnNames = this.getColumnNames();
  }

  public get columns() {
    return this._columns;
  }

  @Output()
  public selectRow = new EventEmitter<{ id: string; selected: boolean }>();

  private _rows: AttributeListRowModel[] = [];
  private _columns: AttributeListColumnModel[] = [];
  public columnNames: string[] = [];

  private columnWidths: Map<string, number> = new Map();
  private isResizing = false;

  public trackByRowId(idx: number, row: AttributeListRowModel) {
    return row.id;
  }

  public trackByColumnId(idx: number, column: AttributeListColumnModel) {
    return column.id;
  }

  private getColumnNames(): string[] {
    if (!this.columns) {
      return [];
    }
    return this.columns.map(c => c.label || c.id);
  }

  public columnWidthChanged(widthDelta: number, col: AttributeListColumnModel) {
    const curWidth = this.columnWidths.get(col.id) || DEFAULT_COLUMN_WIDTH;
    const MIN_WIDTH = 80;
    const MAX_WIDTH = 500;
    this.columnWidths.set(col.id, Math.min(Math.max(MIN_WIDTH, (curWidth + widthDelta)), MAX_WIDTH));
    setTimeout(() => this.isResizing = false, 250);
  }

  public stopEvent($event: MouseEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    this.isResizing = true;
  }

  public getColumnWidth(col: AttributeListColumnModel) {
    return `${this.columnWidths.get(col.id) || DEFAULT_COLUMN_WIDTH}px`;
  }

  public onRowClick($event: MouseEvent, row: AttributeListRowModel): void {
    $event.stopPropagation();
    this.selectRow.emit({ id: row.id, selected: !row.selected });
  }

}
