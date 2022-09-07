import * as MapActions from './map.actions';
import { initialMapState, MapState } from './map.state';
import { mapReducer } from './map.reducer';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { getAppLayerModel, getBoundsModel, getCrsModel, getLayerTreeNode, getServiceModel } from '@tailormap-viewer/api';

describe('MapReducer', () => {

  test('handles MapActions.loadMap', () => {
    const initialState: MapState = { ...initialMapState };
    const action = MapActions.loadMap({ id: 1 });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADING);
  });

  test('handles MapActions.loadMapSuccess', () => {
    const initialState: MapState = { ...initialMapState, loadStatus: LoadingStateEnum.LOADING };
    const crs = getCrsModel();
    const initialExtent = getBoundsModel();
    const appLayers = [
      getAppLayerModel(),
      getAppLayerModel(),
    ];
    const action = MapActions.loadMapSuccess({
      layerTreeNodes: [],
      services: [],
      initialExtent,
      crs,
      appLayers,
      baseLayerTreeNodes: [],
      maxExtent: null,
    });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.LOADED);
    expect(updatedState.mapSettings?.crs).toEqual(crs);
    expect(updatedState.mapSettings?.initialExtent).toEqual(initialExtent);
    expect(updatedState.layers).toEqual(appLayers);
  });

  test('handles MapActions.loadMapFailed', () => {
    const initialState: MapState = { ...initialMapState, loadStatus: LoadingStateEnum.LOADING };
    const action = MapActions.loadMapFailed({ error: 'That is weird, an error occurred' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.loadStatus).toEqual(LoadingStateEnum.FAILED);
    expect(updatedState.errorMessage).toEqual('That is weird, an error occurred');
  });

  test('handles MapActions.setLayerVisibility', () => {
    const initialState: MapState = {
      ...initialMapState,
      layers: [
        getAppLayerModel({ id: 1, visible: false }),
        getAppLayerModel({ id: 2, visible: true }),
      ],
    };
    const action = MapActions.setLayerVisibility({ visibility: [{ id: 1, checked: true }, { id: 2, checked: false }] });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers[0].visible).toEqual(true);
    expect(updatedState.layers[1].visible).toEqual(false);
  });

  test('handles MapActions.toggleAllLayersVisibility', () => {
    const initialState: MapState = {
      ...initialMapState,
      layers: [
        getAppLayerModel({ id: 1, visible: false }),
        getAppLayerModel({ id: 2, visible: true }),
        getAppLayerModel({ id: 3, visible: true }),
        getAppLayerModel({ id: 4, visible: false }),
      ],
      layerTreeNodes: [
        getLayerTreeNode({ root: true, childrenIds: [ 'level-1', 'level-2' ] }),
        getLayerTreeNode({ id: 'level-1', root: false, childrenIds: ['layer-1'] }),
        getLayerTreeNode({ id: 'layer-1', appLayerId: 1, name: 'TEST', root: false }),
        getLayerTreeNode({ id: 'level-2', root: false, childrenIds: [ 'layer-2', 'layer-3' ] }),
        getLayerTreeNode({ id: 'layer-2', appLayerId: 2, name: 'TEST2', root: false }),
        getLayerTreeNode({ id: 'layer-3', appLayerId: 3, name: 'TEST3', root: false }),
      ],
      baseLayerTreeNodes: [
        getLayerTreeNode({ root: true, childrenIds: ['layer-4'] }),
        getLayerTreeNode({ id: 'layer-4', appLayerId: 4, name: 'TEST4', root: false }),
      ],
    };
    const action = MapActions.toggleAllLayersVisibility();
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers.find(l => l.id === 1)?.visible).toEqual(true);
    expect(updatedState.layers.find(l => l.id === 2)?.visible).toEqual(true);
    expect(updatedState.layers.find(l => l.id === 3)?.visible).toEqual(true);
    expect(updatedState.layers.find(l => l.id === 4)?.visible).toEqual(false);

    const updatedState2 = mapReducer(updatedState, action);
    expect(updatedState2.layers.find(l => l.id === 1)?.visible).toEqual(false);
    expect(updatedState2.layers.find(l => l.id === 2)?.visible).toEqual(false);
    expect(updatedState2.layers.find(l => l.id === 3)?.visible).toEqual(false);
    expect(updatedState2.layers.find(l => l.id === 4)?.visible).toEqual(false);
  });

  test('handles MapActions.toggleLevelExpansion', () => {
    const initialState: MapState = {
      ...initialMapState,
      layerTreeNodes: [
        { ...getLayerTreeNode({ id: '1' }), expanded: false },
        { ...getLayerTreeNode({ id: '2' }), expanded: true },
      ],
    };
    const action = MapActions.toggleLevelExpansion({ id: '1' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layerTreeNodes[0].expanded).toEqual(true);
    expect(updatedState.layerTreeNodes[1].expanded).toEqual(true);
  });

  test('handles MapActions.setSelectedLayerId', () => {
    const initialState: MapState = { ...initialMapState };
    const action = MapActions.setSelectedLayerId({ layerId: 1 });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.selectedLayer).toEqual(1);
  });

  test('handles MapActions.addServices', () => {
    const initialState: MapState = {
      ...initialMapState,
      services: [
        getServiceModel({ id: 1 }),
      ],
    };
    const action = MapActions.addServices({ services: [getServiceModel({ id: 2 })] });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.services.length).toEqual(2);
    expect(updatedState.services.map(s => s.id)).toEqual([ 1, 2 ]);
  });

  test('handles MapActions.addAppLayers', () => {
    const initialState: MapState = {
      ...initialMapState,
      layers: [
        getAppLayerModel({ id: 1 }),
      ],
    };
    const action = MapActions.addAppLayers({ appLayers: [getAppLayerModel({ id: 2 })] });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers.length).toEqual(2);
    expect(updatedState.layers.map(s => s.id)).toEqual([ 1, 2 ]);
  });

  test('handles MapActions.addLayerTreeNodes', () => {
    const initialState: MapState = {
      ...initialMapState,
      layerTreeNodes: [
        getLayerTreeNode({ id: '1' }),
        getLayerTreeNode({ id: '2' }),
      ],
    };
    const action = MapActions.addLayerTreeNodes({ layerTreeNodes: [getLayerTreeNode({ id: '3' })] });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layerTreeNodes.length).toEqual(3);
    expect(updatedState.layerTreeNodes.map(s => s.id)).toEqual([ '1', '2', '3' ]);
  });

  test('handles MapActions.moveLayerTreeNode - move to root', () => {
    const initialState: MapState = {
      ...initialMapState,
      layerTreeNodes: [
        getLayerTreeNode({ root: true, childrenIds: [ 'level-1', 'level-2' ] }),
        getLayerTreeNode({ id: 'level-1', root: false, childrenIds: ['layer-1'] }),
        getLayerTreeNode({ id: 'layer-1', appLayerId: 1, name: 'TEST', root: false }),
        getLayerTreeNode({ id: 'level-2', root: false, childrenIds: [ 'layer-2', 'layer-3' ] }),
        getLayerTreeNode({ id: 'layer-2', appLayerId: 2, name: 'TEST2', root: false }),
        getLayerTreeNode({ id: 'layer-3', appLayerId: 4, name: 'TEST4', root: false }),
      ],
    };
    const action = MapActions.moveLayerTreeNode({ nodeId: 'layer-3' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layerTreeNodes[0].childrenIds).toEqual([ 'level-1', 'level-2', 'layer-3' ]);
    expect(updatedState.layerTreeNodes[3].childrenIds).toEqual(['layer-2']);
  });

  test('handles MapActions.moveLayerTreeNode - move to different parent', () => {
    const initialState: MapState = {
      ...initialMapState,
      layerTreeNodes: [
        getLayerTreeNode({ root: true, childrenIds: [ 'level-1', 'level-2' ] }),
        getLayerTreeNode({ id: 'level-1', root: false, childrenIds: ['layer-1'] }),
        getLayerTreeNode({ id: 'layer-1', appLayerId: 1, name: 'TEST', root: false }),
        getLayerTreeNode({ id: 'level-2', root: false, childrenIds: [ 'layer-2', 'layer-3' ] }),
        getLayerTreeNode({ id: 'layer-2', appLayerId: 2, name: 'TEST2', root: false }),
        getLayerTreeNode({ id: 'layer-3', appLayerId: 4, name: 'TEST4', root: false }),
      ],
    };
    const action = MapActions.moveLayerTreeNode({ nodeId: 'layer-3', parentId: 'level-1' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layerTreeNodes[1].childrenIds).toEqual([ 'layer-1', 'layer-3' ]);
    expect(updatedState.layerTreeNodes[3].childrenIds).toEqual(['layer-2']);
  });

  test('handles MapActions.moveLayerTreeNode - move to different parent at certain index', () => {
    const initialState: MapState = {
      ...initialMapState,
      layerTreeNodes: [
        getLayerTreeNode({ root: true, childrenIds: [ 'level-1', 'level-2' ] }),
        getLayerTreeNode({ id: 'level-1', root: false, childrenIds: ['layer-1'] }),
        getLayerTreeNode({ id: 'layer-1', appLayerId: 1, name: 'TEST', root: false }),
        getLayerTreeNode({ id: 'level-2', root: false, childrenIds: [ 'layer-2', 'layer-3' ] }),
        getLayerTreeNode({ id: 'layer-2', appLayerId: 2, name: 'TEST2', root: false }),
        getLayerTreeNode({ id: 'layer-3', appLayerId: 4, name: 'TEST4', root: false }),
      ],
    };
    const action = MapActions.moveLayerTreeNode({ nodeId: 'layer-3', parentId: 'level-1', beforeNodeId: 'layer-1' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layerTreeNodes[1].childrenIds).toEqual([ 'layer-3', 'layer-1' ]);
    expect(updatedState.layerTreeNodes[3].childrenIds).toEqual(['layer-2']);
  });

  test('handles MapActions.setSelectedBackgroundNodeId - make background layers visible', () => {
    const layers = [
      getAppLayerModel({ id: 1, visible: false }),
      getAppLayerModel({ id: 2, visible: false }),
      getAppLayerModel({ id: 3, visible: false }),
      getAppLayerModel({ id: 4, visible: false }),
      getAppLayerModel({ id: 5, visible: true }),
    ];
    const nodes = [
      getLayerTreeNode({ root: true, childrenIds: ['lvl_1'] }),
      getLayerTreeNode({ id: 'lvl_1', childrenIds: [ 'lvl_2', 'lyr_1', 'lyr_2' ] }),
      getLayerTreeNode({ id: 'lyr_1', appLayerId: 1 }),
      getLayerTreeNode({ id: 'lyr_2', appLayerId: 2 }),
      getLayerTreeNode({ id: 'lvl_2', childrenIds: ['lyr_3'] }),
      getLayerTreeNode({ id: 'lyr_3', appLayerId: 3 }),
    ];
    const initialState: MapState = {
      ...initialMapState,
      baseLayerTreeNodes: nodes,
      layers,
    };
    const action = MapActions.setSelectedBackgroundNodeId({ id: 'lvl_1' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers[0].visible).toEqual(true);
    expect(updatedState.layers[1].visible).toEqual(true);
    expect(updatedState.layers[2].visible).toEqual(true);
    expect(updatedState.layers[3].visible).toEqual(false); // unchanged
    expect(updatedState.layers[4].visible).toEqual(true); // unchanged
    expect(updatedState.selectedBackgroundNode).toEqual('lvl_1');
  });

  test('handles MapActions.setSelectedBackgroundNodeId - make background layers visible with multiple background layer groups', () => {
    const layers = [
      getAppLayerModel({ id: 1, visible: false }),
      getAppLayerModel({ id: 2, visible: false }),
      getAppLayerModel({ id: 3, visible: false }),
      getAppLayerModel({ id: 4, visible: false }),
      getAppLayerModel({ id: 5, visible: true }),
    ];
    const nodes = [
      getLayerTreeNode({ root: true, childrenIds: [ 'lvl_1', 'lvl_2' ] }),
      getLayerTreeNode({ id: 'lvl_1', childrenIds: [ 'lyr_1', 'lyr_2' ] }),
      getLayerTreeNode({ id: 'lyr_1', appLayerId: 1 }),
      getLayerTreeNode({ id: 'lyr_2', appLayerId: 2 }),
      getLayerTreeNode({ id: 'lvl_2', childrenIds: ['lyr_3'] }),
      getLayerTreeNode({ id: 'lyr_3', appLayerId: 3 }),
    ];
    const initialState: MapState = {
      ...initialMapState,
      baseLayerTreeNodes: nodes,
      layers,
    };
    const action = MapActions.setSelectedBackgroundNodeId({ id: 'lvl_1' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers[0].visible).toEqual(true);
    expect(updatedState.layers[1].visible).toEqual(true);
    expect(updatedState.layers[2].visible).toEqual(false);
    expect(updatedState.layers[3].visible).toEqual(false); // unchanged
    expect(updatedState.layers[4].visible).toEqual(true); // unchanged
    expect(updatedState.selectedBackgroundNode).toEqual('lvl_1');

    const action2 = MapActions.setSelectedBackgroundNodeId({ id: 'lvl_2' });
    const updatedState2 = mapReducer(updatedState, action2);
    expect(updatedState2.layers[0].visible).toEqual(false);
    expect(updatedState2.layers[1].visible).toEqual(false);
    expect(updatedState2.layers[2].visible).toEqual(true);
    expect(updatedState2.layers[3].visible).toEqual(false); // unchanged
    expect(updatedState2.layers[4].visible).toEqual(true); // unchanged
    expect(updatedState2.selectedBackgroundNode).toEqual('lvl_2');
  });

  test('handles MapActions.setSelectedBackgroundNodeId - make background layers hidden', () => {
    const layers = [
      getAppLayerModel({ id: 1, visible: true }),
      getAppLayerModel({ id: 2, visible: true }),
      getAppLayerModel({ id: 3, visible: true }),
      getAppLayerModel({ id: 4, visible: false }),
      getAppLayerModel({ id: 5, visible: true }),
    ];
    const nodes = [
      getLayerTreeNode({ root: true, childrenIds: ['lvl_1'] }),
      getLayerTreeNode({ id: 'lvl_1', childrenIds: [ 'lvl_2', 'lyr_1', 'lyr_2' ] }),
      getLayerTreeNode({ id: 'lyr_1', appLayerId: 1 }),
      getLayerTreeNode({ id: 'lyr_2', appLayerId: 2 }),
      getLayerTreeNode({ id: 'lvl_2', childrenIds: ['lyr_3'] }),
      getLayerTreeNode({ id: 'lyr_3', appLayerId: 3 }),
    ];
    const initialState: MapState = {
      ...initialMapState,
      baseLayerTreeNodes: nodes,
      layers,
    };
    const action = MapActions.setSelectedBackgroundNodeId({ id: 'EMPTY' });
    const updatedState = mapReducer(initialState, action);
    expect(updatedState.layers[0].visible).toEqual(false);
    expect(updatedState.layers[1].visible).toEqual(false);
    expect(updatedState.layers[2].visible).toEqual(false);
    expect(updatedState.layers[3].visible).toEqual(false); // unchanged
    expect(updatedState.layers[4].visible).toEqual(true); // unchanged
    expect(updatedState.selectedBackgroundNode).toEqual('EMPTY');
  });

});
