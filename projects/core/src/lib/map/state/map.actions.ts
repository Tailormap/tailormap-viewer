import { createAction, props } from '@ngrx/store';
import { AppLayerModel, LayerDetailsModel, LayerTreeNodeModel, ServiceModel } from '@tailormap-viewer/api';
import { ExtendedMapResponseModel } from '../models/extended-map-response.model';
import { ExtendedLayerTreeNodeModel } from '../models';

const mapActionsPrefix = '[Map]';

export const loadMap = createAction(
  `${mapActionsPrefix} Load Map`,
  props<{ id: string }>(),
);
export const loadMapSuccess = createAction(
  `${mapActionsPrefix} Map Load Success`,
  props<ExtendedMapResponseModel>(),
);
export const loadMapFailed = createAction(
  `${mapActionsPrefix} Map Load Failed`,
  props<{ error?: string }>(),
);
export const setLayerVisibility = createAction(
  `${mapActionsPrefix} Set Layer Visibility`,
  props<{ visibility: Array<{ id: string; checked: boolean }> }>(),
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
  props<{ layerId: string }>(),
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
  props<{ nodes: Array<{ nodeId: string; children: string[] }>; isBaseLayerTree?: boolean }>(),
);
export const setSelectedBackgroundNodeId = createAction(
  `${mapActionsPrefix} Set Selected Background Node ID`,
  props<{ id: string }>(),
);
export const setLayerOpacity = createAction(
  `${mapActionsPrefix} Set Layer Opacity`,
  props<{ opacity: Array<{ id: string; opacity: number }> }>(),
);
export const addLayerDetails = createAction(
  `${mapActionsPrefix} Add Layer Details`,
  props<{ layerDetails: LayerDetailsModel }>(),
);
export const updateLayerTreeNodes = createAction(
  `${mapActionsPrefix} Update Layer Tree`,
  props<{ layerTreeNodes: ExtendedLayerTreeNodeModel[] }>(),
);
export const toggleIn3DView = createAction(
  `${mapActionsPrefix} Toggle In3DView`,
);
