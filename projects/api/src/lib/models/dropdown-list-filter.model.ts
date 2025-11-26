import { AttributeValueSettings } from './checkbox-filter.model';
import { FilterToolEnum } from './filter-tool.enum';

export interface DropdownListFilterModel {
  filterTool: FilterToolEnum.DROPDOWN_LIST;
  attributeValuesSettings: AttributeValueSettings[];
}
