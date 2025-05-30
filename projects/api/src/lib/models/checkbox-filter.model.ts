import { FilterToolEnum } from './filter-tool.enum';

export interface AttributeValueSettings {
  value: string;
  initiallySelected: boolean;
  selectable: boolean;
  alias?: string;
}

export interface CheckboxFilterModel {
  attributeValuesSettings: AttributeValueSettings[];
  filterTool: FilterToolEnum.CHECKBOX;
}
