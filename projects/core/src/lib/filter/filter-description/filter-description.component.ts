import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { BaseFilterModel, AttributeFilterModel } from '@tailormap-viewer/api';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { AttributeType } from '@tailormap-viewer/api';
import { DateTime } from 'luxon';
import { MAT_DATE_LOCALE } from '@angular/material/core';


@Component({
  selector: 'tm-filter-description',
  templateUrl: './filter-description.component.html',
  styleUrls: ['./filter-description.component.css'],
  standalone: false,
})
export class FilterDescriptionComponent {

  private dateLocale = inject<string>(MAT_DATE_LOCALE);
  private sanitizer = inject(DomSanitizer);
  private AND = $localize `:@@core.filter.and:and`;
  private OR = $localize `:@@core.filter.or:or`;

  public description: SafeHtml | null = null;

  // @TODO: support multiple filterGroups with parentGroups
  @Input()
  public set filterGroup(filterGroup: ExtendedFilterGroupModel) {
    const queryDescription = this.convertGroupToDescription(filterGroup);
    if (!queryDescription) {
      this.description = null;
      return;
    }
    this.description = this.sanitizer.bypassSecurityTrustHtml(queryDescription);
  }

  public convertGroupToDescription(filterGroup: ExtendedFilterGroupModel) {
    return filterGroup.filters
      .filter(filter => FilterTypeHelper.isAttributeFilter(filter) && !filter.editConfiguration)
      .map(filter => this.convertFilterToDescription(filter))
      .join(` ${this.convertOperator(filterGroup.operator)} `);
  }

  private convertFilterToDescription(filter: BaseFilterModel) {
    if (FilterTypeHelper.isSpatialFilter(filter)) {
      return '';
    }
    if (FilterTypeHelper.isAttributeFilter(filter)) {
      return this.convertAttributeFilterToDescription(filter);
    }
    return '';
  }

  private convertAttributeFilterToDescription(filter: AttributeFilterModel) {
    let values = filter.value;
    if (filter.attributeType === AttributeType.DATE) {
      values = filter.value.map(v => DateTime.fromISO(v).setLocale(this.dateLocale).toLocaleString(DateTime.DATE_MED));
    }
    let value = values.join(', ');
    if (values.length === 2) {
      value = `${values[0]} ${this.AND} ${values[1]}`;
    }
    return `<strong>${filter.attribute}</strong> ${this.convertCondition(filter.condition, filter.invertCondition)} <strong>${value}</strong>`;
  }

  private convertOperator(operator: 'AND' | 'OR') {
    return `<em>${operator === 'AND' ? this.AND : this.OR}</em>`;
  }

  private convertCondition(condition: string, invertedCondition: boolean) {
    const conditionType = AttributeFilterHelper.getConditionTypes(true)
      .find(c => c.condition === condition);
    if (conditionType) {
      return invertedCondition ? conditionType.inverseReadableLabel : conditionType.readableLabel;
    }
    return '';
  }

}
