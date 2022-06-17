import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';

export const attributeListStateKey = 'attributeList';

export interface AttributeListState {
  visible: boolean;
  tabs: AttributeListTabModel[];
  data: AttributeListDataModel[];
  selectedTabId?: string;
  height: number;
}

export const initialAttributeListState: AttributeListState = {
  visible: false,
  tabs: [],
  data: [],
  height: 350,
};
