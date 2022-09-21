import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '../../../filter/models/attribute-filter.model';
import { FilterConditionEnum } from '../../../filter/models/filter-condition.enum';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { ATTRIBUTE_LIST_ID } from '../attribute-list-identifier';

export interface FilterDialogData {
  columnName: string;
  layerId: number;
  filter: AttributeFilterModel | null;
  columnType: FeatureAttributeTypeEnum;
  cqlFilter?: string;
}

interface FilterType {
  condition?: FilterConditionEnum;
  value?: string[];
}

@Component({
  selector: 'tm-attribute-list-filter',
  templateUrl: './attribute-list-filter.component.html',
  styleUrls: ['./attribute-list-filter.component.css'],
})
export class AttributeListFilterComponent implements OnInit {

  public uniqueValues$: Observable<string[]> | null = null;
  public filter: FilterType = {};
  private updatedFilter: FilterType = {};

  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);
  private dialogRef = inject(MatDialogRef<AttributeListFilterComponent>);
  public data: FilterDialogData = inject(MAT_DIALOG_DATA);

  public ngOnInit(): void {
    this.uniqueValues$ = this.getUniqueValues$();
    if (!this.data.filter) {
      return;
    }
    this.filter = {
      condition: this.data.filter.condition,
      value: this.data.filter.value,
    };
    this.updatedFilter = { ...this.filter };
  }

  public onOk() {
    if (!this.updatedFilter.condition) {
      return;
    }
    this.simpleAttributeFilterService.setFilter(ATTRIBUTE_LIST_ID, this.data.layerId, {
      condition: this.updatedFilter.condition,
      value: this.getValue(),
      attribute: this.data.columnName,
      attributeType: this.data.columnType,
      caseSensitive: false,
      invertCondition: false,
    });
    this.dialogRef.close();
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public onClear() {
    this.simpleAttributeFilterService.removeFilter(ATTRIBUTE_LIST_ID, this.data.layerId, this.data.columnName);
    this.dialogRef.close();
  }

  public getUniqueValues$(): Observable<string[]> {
    return of([]);
  }

  public updateFilter(filter: { condition: FilterConditionEnum; value: string[] }) {
    this.updatedFilter = filter;
  }

  private getValue() {
    if (typeof this.updatedFilter.value === 'undefined') {
      return [];
    }
    return this.updatedFilter.value;
  }

}
