import { Component, computed, inject, input } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AttributeFilterModel, AttributeType } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { DateTime } from 'luxon';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { FilterTypeHelper } from '../helpers/filter-type.helper';

interface FilterDescriptionModel {
  id: string;
  attribute: string;
  condition: string;
  values: string[];
}

@Component({
  selector: 'tm-filter-description',
  templateUrl: './filter-description.component.html',
  styleUrls: ['./filter-description.component.css'],
})
export class FilterDescriptionComponent {

  private dateLocale = inject<string>(MAT_DATE_LOCALE);
  public filterGroup = input.required<ExtendedFilterGroupModel>();

  public filters = computed<FilterDescriptionModel[]>(() => {
    return this.filterGroup().filters
      .filter(FilterTypeHelper.isAttributeFilter)
      .filter(filter => !filter.editConfiguration && !filter.generatedByFilterId)
      .map(filter => ({
        id: filter.id,
        attribute: filter.attributeAlias ?? filter.attribute,
        condition: this.getCondition(filter),
        values: this.getValues(filter),
      }));
  });

  public operator = computed(() => this.filterGroup().operator);

  private getCondition(filter: AttributeFilterModel) {
    const conditionType = AttributeFilterHelper.getConditionTypes(true)
      .find(c => c.condition === filter.condition);
    if (!conditionType) {
      return '';
    }
    return filter.invertCondition ? conditionType.inverseReadableLabel : conditionType.readableLabel;
  }

  private getValues(filter: AttributeFilterModel) {
    if (filter.attributeType === AttributeType.DATE) {
      return filter.value.map(v => DateTime.fromISO(v).setLocale(this.dateLocale).toLocaleString(DateTime.DATE_MED));
    }
    return filter.value;
  }

}
