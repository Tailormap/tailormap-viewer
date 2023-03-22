import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { BaseComponentTypeEnum, FeatureAttributeTypeEnum, UniqueValuesService } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '../../../filter/models/attribute-filter.model';
import { FilterConditionEnum } from '../../../filter/models/filter-condition.enum';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { AttributeFilterHelper } from '../../../filter/helpers/attribute-filter.helper';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

export interface FilterDialogData {
  columnName: string;
  layerId: string;
  filter: AttributeFilterModel | null;
  columnType: FeatureAttributeTypeEnum;
  cqlFilter?: string;
  applicationId: string;
}

interface FilterType {
  condition?: FilterConditionEnum;
  value?: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

@Component({
  selector: 'tm-attribute-list-filter',
  templateUrl: './attribute-list-filter.component.html',
  styleUrls: ['./attribute-list-filter.component.css'],
})
export class AttributeListFilterComponent implements OnInit {

  public uniqueValues$: Observable<string[]> | null = null;
  public filter: FilterType = {};
  public updatedFilter: FilterType = {};

  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);
  private dialogRef = inject(MatDialogRef<AttributeListFilterComponent>);
  private data: FilterDialogData = inject(MAT_DIALOG_DATA);
  private uniqueValuesService = inject(UniqueValuesService);

  public ngOnInit(): void {
    this.uniqueValues$ = this.getUniqueValues$();
    if (!this.data.filter) {
      return;
    }
    this.filter = {
      condition: this.data.filter.condition,
      value: this.data.filter.value,
      caseSensitive: this.data.filter.caseSensitive,
      invertCondition: this.data.filter.invertCondition,
    };
    this.updatedFilter = { ...this.filter };
  }

  public onOk() {
    const filter = this.getFilter();
    if (!AttributeFilterHelper.isValidFilter(filter)) {
      return;
    }
    this.simpleAttributeFilterService.setFilter(BaseComponentTypeEnum.ATTRIBUTE_LIST, this.data.layerId, filter);
    this.dialogRef.close();
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public onClear() {
    this.simpleAttributeFilterService.removeFilter(BaseComponentTypeEnum.ATTRIBUTE_LIST, this.data.layerId, this.data.columnName);
    this.dialogRef.close();
  }

  public getUniqueValues$(): Observable<string[]> {
    return this.uniqueValuesService.getUniqueValues$({
      attribute: this.data.columnName,
      layerId: this.data.layerId,
      filter: this.data.cqlFilter,
      applicationId: this.data.applicationId,
    })
      .pipe(
        map(response => {
          return response.values.map(v => `${v}`) || [];
        }),
      );
  }

  public updateFilter(filter: {
    condition: FilterConditionEnum;
    value: string[];
    caseSensitive?: boolean;
    invertCondition?: boolean;
  }) {
    this.updatedFilter = filter;
  }

  public getAttributeType() {
    return this.data.columnType;
  }

  public getColumnName() {
    return this.data.columnName;
  }

  public isValidFilter() {
    return AttributeFilterHelper.isValidFilter(this.getFilter());
  }

  private getFilter(): Omit<AttributeFilterModel, 'id'> | null {
    if (!this.updatedFilter.condition) {
      return null;
    }
    return {
      type: FilterTypeEnum.ATTRIBUTE,
      condition: this.updatedFilter.condition,
      value: typeof this.updatedFilter.value === 'undefined' ? [] : this.updatedFilter.value,
      attribute: this.data.columnName,
      attributeType: this.data.columnType,
      caseSensitive: typeof this.updatedFilter.caseSensitive === 'boolean'
        ? this.updatedFilter.caseSensitive
        : false,
      invertCondition: typeof this.updatedFilter.invertCondition === 'boolean'
        ? this.updatedFilter.invertCondition
        : false,
    };
  }

}
