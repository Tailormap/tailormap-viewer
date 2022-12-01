import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AttributeFilterHelper } from '../helpers/attribute-filter.helper';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { BaseFilterModel } from '../models/base-filter.model';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { DateTime } from 'luxon';
import { MAT_DATE_LOCALE } from '@angular/material/core';


@Component({
  selector: 'tm-filter-description',
  templateUrl: './filter-description.component.html',
  styleUrls: ['./filter-description.component.css'],
})
export class FilterDescriptionComponent {

  private dateLocale = inject<string>(MAT_DATE_LOCALE);
  private sanitizer = inject(DomSanitizer);
  private AND = $localize `and`;
  private OR = $localize `or`;

  public description: SafeHtml = '';

  // @TODO: support multiple filterGroups with parentGroups
  @Input()
  public set filterGroup(filterGroup: ExtendedFilterGroupModel) {
    const queryDescription = this.convertGroupToDescription(filterGroup);
    this.description = this.sanitizer.bypassSecurityTrustHtml(queryDescription);
  }

  public convertGroupToDescription(filterGroup: ExtendedFilterGroupModel) {
    return filterGroup.filters
      .map(filter => this.convertFilterToDescription(filter))
      .join(` ${this.convertOperator(filterGroup.operator)} `);
  }

  private convertFilterToDescription(filter: BaseFilterModel) {
    if (FilterTypeHelper.isSpatialFilter(filter)) {
      return $localize `intersects with drawn geometry`;
    }
    if (FilterTypeHelper.isAttributeFilter(filter)) {
      return this.convertAttributeFilterToDescription(filter);
    }
    return '';
  }

  private convertAttributeFilterToDescription(filter: AttributeFilterModel) {
    let values = filter.value;
    if (filter.attributeType === FeatureAttributeTypeEnum.DATE) {
      values = filter.value.map(v => DateTime.fromISO(v).setLocale(this.dateLocale).toLocaleString(DateTime.DATE_MED));
    }
    let value = values.join(',');
    if (values.length === 2) {
      value = `${values[0]} ${this.AND} ${values[1]}`;
    }
    return `<strong>${filter.attribute}</strong> ${this.convertCondition(filter.condition)} <strong>${value}</strong>`;
  }

  private convertOperator(operator: 'AND' | 'OR') {
    return `<em>${operator === 'AND' ? this.AND : this.OR}</em>`;
  }

  private convertCondition(condition: string) {
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === condition)?.readableLabel || '';
  }

}
