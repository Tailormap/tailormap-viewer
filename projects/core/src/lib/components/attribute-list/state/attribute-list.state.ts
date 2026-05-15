import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { FeatureModel } from '@tailormap-viewer/api';
import { AttributeListInitialDataSortModel } from '../models/attribute-list-initial-data-sort.model';

export const attributeListStateKey = 'attributeList';

export interface AttributeListState {
  visible: boolean;
  tabs: AttributeListTabModel[];
  data: AttributeListDataModel[];
  selectedTabId?: string;
  highlightedFeature?: FeatureModel & { tabId: string } | null;
  /* Data sorting to be directly applied on creation of a new data tab */
  initialDataSort?: AttributeListInitialDataSortModel[];
}

export const initialAttributeListState: AttributeListState = {
  visible: false,
  tabs: [],
  data: [],
};
