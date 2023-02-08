import { createAction, props } from '@ngrx/store';
import { AppLayerModel, LayerTreeNodeModel, MapResponseModel, ServiceModel } from '@tailormap-viewer/api';

const mapActionsPrefix = '[Map]';

export const loadMap = createAction(
  `${mapActionsPrefix} Load Map`,
  props<{ id: number }>(),
);
export const loadMapSuccess = createAction(
  `${mapActionsPrefix} Map Load Success`,
  props<MapResponseModel>(),
);
export const loadMapFailed = createAction(
  `${mapActionsPrefix} Map Load Failed`,
  props<{ error?: string }>(),
);
export const setLayerVisibility = createAction(
  `${mapActionsPrefix} Set Layer Visibility`,
  props<{ visibility: Array<{ id: number; checked: boolean }> }>(),
);
export const toggleAllLayersVisibility = createAction(
  `${mapActionsPrefix} Toggle All Layers Visibility`,
);
export const toggleLevelExpansion = createAction(
  `${mapActionsPrefix} Toggle Level Expansion`,
  props<{ id: string; isBaseLayerTree?: boolean }>(),
);
export const setSelectedLayerId = createAction(
  `${mapActionsPrefix} Set Selected Layer ID`,
  props<{ layerId: number }>(),
);
export const addServices = createAction(
  `${mapActionsPrefix} Add Services`,
  props<{ services: ServiceModel[] }>(),
);
export const addAppLayers = createAction(
  `${mapActionsPrefix} Add App Layers`,
  props<{ appLayers: AppLayerModel[] }>(),
);
export const addLayerTreeNodes = createAction(
  `${mapActionsPrefix} Add Layer Tree Nodes`,
  props<{ layerTreeNodes: LayerTreeNodeModel[]; isBaseLayerTree?: boolean }>(),
);
export const moveLayerTreeNode = createAction(
  `${mapActionsPrefix} Move Layer Tree Nodes`,
  props<{ nodeId: string; position: 'before' | 'after' | 'inside'; parentId?: string; sibling?: string; isBaseLayerTree?: boolean }>(),
);
export const setLayerTreeNodeChildren = createAction(
  `${mapActionsPrefix} Set Layer Tree Node Children`,
  props<{ nodeId: string; children: string[]; isBaseLayerTree?: boolean }>(),
);
export const setSelectedBackgroundNodeId = createAction(
  `${mapActionsPrefix} Set Selected Background Node ID`,
  props<{ id: string }>(),
);
export const setLayerOpacity = createAction(
  `${mapActionsPrefix} Set Layer Opacity`,
  props<{ layerId: number; opacity: number }>(),
);
