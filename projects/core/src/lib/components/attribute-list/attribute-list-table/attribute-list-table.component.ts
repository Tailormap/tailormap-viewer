import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output, input, computed, signal } from '@angular/core';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { AttributeType } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { FeatureDetailsModel } from '../models/attribute-list-api-service.model';

const DEFAULT_COLUMN_WIDTH = 170;

@Component({
  selector: 'tm-attribute-list-table',
  templateUrl: './attribute-list-table.component.html',
  styleUrls: ['./attribute-list-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  public columns = input<AttributeListColumnModel[] | null>([]);

  @Input()
  public sort: { column: string; direction: string } | null = null;

  @Input()
  public set filters(filters: AttributeFilterModel[] | null) {
    if (filters === null) {
      return;
    }
    this.filtersDictionary = new Map<string, AttributeFilterModel>(filters.map(f => [ f.attribute, f ]));
  }

  @Input()
  public selectedRowId: string | undefined | null;

  public canExpandRows = input<boolean | null>(false);

  public featureDetails = input<Map<string, FeatureDetailsModel> | null>(new Map());

  @Output()
  public selectRow = new EventEmitter<{ id: string; selected: boolean }>();

  @Output()
  public setSort = new EventEmitter<{ columnId: string; direction: 'asc' | 'desc' | '' }>();

  @Output()
  public setFilter = new EventEmitter<{ columnId: string; attributeType: AttributeType }>();

  @Output()
  public loadFeatureDetailsForFeature = new EventEmitter<string>();

  private _rows: AttributeListRowModel[] = [];
  public columnNames = computed(() => {
    return this.getColumnNames(this.columns(), this.canExpandRows());
  });
  private filtersDictionary: Map<string, AttributeFilterModel> = new Map();

  private columnWidths: Map<string, number> = new Map();
  private isResizing = false;

  public expandedRows = signal<Set<string>>(new Set());

  public readonly EXPAND_DETAILS_COLUMN_NAME = '__tm_attribute_list_expand_details__';
  public readonly EXPAND_DETAILS_ROW_NAME = '__tm_attribute_list_expand_details_row__';

  public trackByRowId(idx: number, row: AttributeListRowModel) {
    return row.id;
  }

  public trackByColumnId(idx: number, column: AttributeListColumnModel) {
    return column.id;
  }

  private getColumnNames(columns: AttributeListColumnModel[] | null, canExpandRows?: boolean | null): string[] {
    if (!columns) {
      return [];
    }
    const names = columns.map(c => c.label || c.id);
    if (canExpandRows) {
      names.unshift(this.EXPAND_DETAILS_COLUMN_NAME);
    }
    return names;
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
    this.selectRow.emit({ id: row.id, selected: !this.isSelected(row) });
  }

  public onSortClick(columnId: string): void {
    if (this.isResizing) {
      return;
    }
    let direction: 'asc' | 'desc' | '' = 'asc';
    if (this.sort && this.sort.column === columnId) {
      direction = this.sort.direction === 'asc' ? 'desc' : '';
    }
    this.setSort.emit({ columnId, direction });
  }

  public onFilterClick($event: MouseEvent, column: AttributeListColumnModel): void {
    $event.stopPropagation();
    this.setFilter.emit({ columnId: column.id, attributeType: column.type });
  }

  public hasFilter(columnId: string) {
    return this.filtersDictionary.has(columnId);
  }

  public hasDisabledFilter(columnId: string) {
    return this.filtersDictionary.get(columnId)?.disabled;
  }

  public isSelected(row: AttributeListRowModel) {
    return this.selectedRowId === row.id;
  }

  protected onRowExpandClick($event: PointerEvent, row: AttributeListRowModel) {
    $event.stopPropagation();
    const rowId = row.id;
    const featureId = row.__fid;
    if (!featureId) {
      return;
    }
    const expandedRows = new Set(this.expandedRows());
    if (expandedRows.has(rowId)) {
      expandedRows.delete(rowId);
    } else {
      expandedRows.add(rowId);
      this.loadFeatureDetailsForFeature.emit(featureId);
    }
    this.expandedRows.set(expandedRows);
  }

}
