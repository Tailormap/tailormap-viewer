import { createAction, props } from '@ngrx/store';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { LoadAttributeListDataResultModel } from '../models/load-attribute-list-data-result.model';
import { FeatureModel } from '@tailormap-viewer/api';

const attributeListActionsPrefix = '[Attributelist]';

export const setAttributeListVisibility = createAction(
  `${attributeListActionsPrefix} Set Visibility`,
  props<{ visible?: boolean }>(),
);

export const changeAttributeListTabs = createAction(
  `${attributeListActionsPrefix} Change Tabs`,
  props<{
    newTabs: AttributeListTabModel[];
    newData: AttributeListDataModel[];
    closedTabs: string[];
  }>(),
);

export const loadData = createAction(
  `${attributeListActionsPrefix} Load Data`,
  props<{ tabId: string }>(),
);

export const loadDataSuccess = createAction(
  `${attributeListActionsPrefix} Load Data Success`,
  props<{ tabId: string; data: LoadAttributeListDataResultModel }>(),
);

export const loadDataFailed = createAction(
  `${attributeListActionsPrefix} Load Data Failed`,
  props<{ tabId: string; data: LoadAttributeListDataResultModel }>(),
);

export const setSelectedTab = createAction(
  `${attributeListActionsPrefix} Set Selected Tab`,
  props<{ tabId: string }>(),
);

export const updatePage = createAction(
  `${attributeListActionsPrefix} Update Page`,
  props<{ dataId: string; page: number }>(),
);

export const updateSort = createAction(
  `${attributeListActionsPrefix} Update Sort`,
  props<{ dataId: string; column: string; direction: 'asc' | 'desc' | '' }>(),
);

export const updateRowSelected = createAction(
  `${attributeListActionsPrefix} Update Row Selected`,
  props<{ dataId: string; rowId: string; selected: boolean }>(),
);

export const setHighlightedFeature = createAction(
  `${attributeListActionsPrefix} Set Highlighted Feature`,
  props<{ feature: FeatureModel & { tabId: string } | null }>(),
);

export const changeColumnPosition = createAction(
  `${attributeListActionsPrefix} Change Column Position`,
  props<{ dataId: string; columnId: string; previousColumn: string | null}>(),
);

export const toggleColumnVisible = createAction(
  `${attributeListActionsPrefix} Toggle Column Visibility`,
  props<{ dataId: string; columnId: string }>(),
);
