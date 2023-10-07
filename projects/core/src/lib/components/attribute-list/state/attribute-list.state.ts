import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { FeatureModel } from '@tailormap-viewer/api';

export const attributeListStateKey = 'attributeList';

export interface AttributeListState {
  visible: boolean;
  tabs: AttributeListTabModel[];
  data: AttributeListDataModel[];
  selectedTabId?: string;
  highlightedFeature?: FeatureModel & { tabId: string } | null;
  panelTitle: string;
}

export const initialAttributeListState: AttributeListState = {
  visible: false,
  tabs: [],
  data: [],
  panelTitle: $localize `:@@core.attribute-list.title:Attribute list`,
};
