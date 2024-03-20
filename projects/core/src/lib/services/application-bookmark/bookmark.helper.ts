import { ArrayHelper } from '@tailormap-viewer/shared';
import { MapSizeHelper, MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';
import { TristateBoolean, LayerVisibilityBookmarkFragment, LayerInformation, LayerTreeOrderBookmarkFragment, LayerTreeOrderInformation } from './bookmark_pb';
import { AppLayerWithInitialValuesModel, ExtendedLayerTreeNodeModel } from '../../map/models';
import { AppLayerModel, MapResponseModel } from '@tailormap-viewer/api';
import { LayerModelHelper } from '../../map/helpers/layer-model.helper';
import { LayerTreeNodeHelper } from '../../map/helpers/layer-tree-node.helper';
import { ExtendedMapResponseModel } from '../../map/models/extended-map-response.model';

export interface MapBookmarkContents {
  visibilityChanges: { id: string; checked: boolean }[];
  opacityChanges: { id: string; opacity: number }[];
}

export type MapLocationBookmarkContents = [[number, number], number];

export type LayerOrderBookmarkContents = Array<{ nodeId: string; children: string[] }>;

export class MapBookmarkHelper {

  public static locationAndZoomFromFragment(fragment: string, viewDetails?: MapViewDetailsModel, unitsOfMeasure?: MapUnitEnum): MapLocationBookmarkContents | undefined {
    const parts = fragment.split(',');
    if (parts.length !== 3) {
      return undefined;
    }

    let center: [number, number] = [ parseFloat(parts[0]), parseFloat(parts[1]) ];
    let zoom = parseFloat(parts[2]);

    if (!isFinite(center[0]) || !isFinite(center[1]) || !isFinite(zoom)) {
      return undefined;
    }

    if (viewDetails && unitsOfMeasure && viewDetails.center !== undefined) {
      const precision = MapSizeHelper.getCoordinatePrecision(unitsOfMeasure);
      const maxDiff = Math.pow(10, -precision);

      const coordinatesChanged = Math.abs(viewDetails.center[0] - center[0]) > maxDiff || Math.abs(viewDetails.center[1] - center[1]) > maxDiff;
      const zoomChanged = Math.abs(viewDetails.zoomLevel - zoom) > 0.1;

      if (!coordinatesChanged && !zoomChanged) {
        return undefined;
      }

      if (!coordinatesChanged) {
        center = [ viewDetails.center[0], viewDetails.center[1] ];
      } else if (!zoomChanged) {
        zoom = viewDetails.zoomLevel;
      }
    }

    return [ center, zoom ];
  }

  public static fragmentFromLocationAndZoom(viewDetails: MapViewDetailsModel, unitsOfMeasure: MapUnitEnum): string | undefined {
    if (viewDetails.center === undefined) {
      return undefined;
    }

    const precision = MapSizeHelper.getCoordinatePrecision(unitsOfMeasure);

    return `${viewDetails.center[0].toFixed(precision)},${viewDetails.center[1].toFixed(precision)},${viewDetails.zoomLevel.toFixed(1)}`;
  }

  public static visibilityDataFromFragment(
    fragment: LayerVisibilityBookmarkFragment,
    layers: AppLayerWithInitialValuesModel[],
    checkInitialValues = true,
  ): MapBookmarkContents {
    const checkedVisibilityValues = new Set();
    const checkedOpacityValues = new Set();

    const visibilityData = [];
    const opacityData = [];

    for (const layer of fragment.layers) {
      const id = layer.appLayerId;

      const currentLayer = layers.find(a => a.id === id);
      if (currentLayer === undefined) {
        continue;
      }

      const isLayerVisible = layer.visible === TristateBoolean.TRUE;
      if (layer.visible !== TristateBoolean.UNSET || (!checkInitialValues && isLayerVisible !== currentLayer.visible)) {
        checkedVisibilityValues.add(id);
        if (isLayerVisible !== currentLayer.visible) {
          visibilityData.push({ id, checked: isLayerVisible });
        }
      }

      const opacity = layer.opacity === 0 ? 100 : layer.opacity - 1;
      if (layer.opacity !== 0 || (!checkInitialValues && opacity !== currentLayer.opacity)) {
        checkedOpacityValues.add(id);
        if (opacity !== currentLayer.opacity) {
          opacityData.push({ id, opacity });
        }
      }
    }

    if (!checkInitialValues) {
      layers.forEach(currentLayer => {
        const id = currentLayer.id;
        const layer = fragment.layers.find(l => l.appLayerId === id);
        if (!layer && currentLayer.visible) {
          visibilityData.push({ id, checked: false });
        }
      });
    }

    // Add all layers which have visibility or[ opacity different from their initial values but which were not in the bookmark, so we have a
    // complete set of values different from the initial values
    if (checkInitialValues) {
      for (const layer of layers) {
        if (!checkedVisibilityValues.has(layer.id) && layer.initialValues?.visible !== layer.visible) {
          visibilityData.push({ id: layer.id, checked: layer.initialValues?.visible ?? true });
        }

        if (!checkedOpacityValues.has(layer.id) && layer.initialValues?.opacity !== layer.opacity) {
          opacityData.push({ id: layer.id, opacity: layer.initialValues?.opacity ?? 100 });
        }
      }
    }

    return { visibilityChanges: visibilityData, opacityChanges: opacityData };
  }

  public static fragmentFromVisibilityData(layers: AppLayerWithInitialValuesModel[]): LayerVisibilityBookmarkFragment {
    const bookmarkData = new LayerVisibilityBookmarkFragment();
    for (const layer of layers) {
      const info = new LayerInformation({ appLayerId: layer.id });
      let changed = false;

      if (layer.visible !== layer.initialValues?.visible) {
          info.visible = layer.visible ? TristateBoolean.TRUE : TristateBoolean.FALSE;
          changed = true;
      }

      if (layer.opacity !== layer.initialValues?.opacity) {
          info.opacity = layer.opacity + 1;
          changed = true;
      }

      if (changed) {
        bookmarkData.layers.push(info);
      }
    }

    return bookmarkData;
  }

  public static fragmentFromLayerTreeOrder(tree: ExtendedLayerTreeNodeModel[]): LayerTreeOrderBookmarkFragment {
    const data: { [name: string]: LayerTreeOrderInformation } = {};

    for (const layer of tree) {
      if (!ArrayHelper.arrayEquals(layer.initialChildren, layer.childrenIds ?? [])) {
       data[layer.id] = new LayerTreeOrderInformation({ children: layer.childrenIds ?? [] });
      }
    }

    return new LayerTreeOrderBookmarkFragment({ ordering: data });
  }

  public static layerTreeOrderFromFragment(
    fragment: LayerTreeOrderBookmarkFragment,
    layers: ExtendedLayerTreeNodeModel[],
  ): LayerOrderBookmarkContents {
    const output = [];
    const outMap = new Map<string, { nodeId: string; children: string[] }>();
    const missingChildren = new Set(layers.map(a => a.id));

    for (const layer of layers) {
       const newChildren = fragment.ordering[layer.id]?.children?.filter(a => layers.some(b => b.id === a)) ?? layer.initialChildren;
       for (const child of newChildren) {
         missingChildren.delete(child);
       }

       if (!ArrayHelper.arrayEquals(layer.childrenIds ?? [], newChildren)) {
         const arr = { nodeId: layer.id, children: newChildren };
         output.push(arr);
         outMap.set(layer.id, arr);
       }
    }

    for (const layer of layers) {
      for (const child of layer.initialChildren) {
        if (missingChildren.has(child)) {
          const item = outMap.get(layer.id);
          if (item === undefined) {
            // Layer tree is missing a child, while  it has not been modified from its initial state.
            // This should not happen. Ignore it, for resilience.
            continue;
          }

          item.children.push(child);
        }
      }
    }

    return output;
  }

  public static mergeMapResponseWithBookmarkData(
    mapResponse: MapResponseModel,
    opacityVisibility: LayerVisibilityBookmarkFragment,
    layerOrder: LayerTreeOrderBookmarkFragment,
  ): ExtendedMapResponseModel {
    const extendedAppLayers = mapResponse.appLayers.map(LayerModelHelper.getLayerWithInitialValues);
    const extendedTreeNodes = LayerTreeNodeHelper.getExtendedLayerTreeNodes(mapResponse.layerTreeNodes, mapResponse.appLayers);
    const bookmarkOpacityVisibility = MapBookmarkHelper.visibilityDataFromFragment(opacityVisibility, extendedAppLayers);
    const bookmarkLayerOrder = MapBookmarkHelper.layerTreeOrderFromFragment(layerOrder, extendedTreeNodes);
    const appLayers = extendedAppLayers.map<AppLayerModel>(layer => {
      const updated = bookmarkOpacityVisibility.visibilityChanges.find(v => v.id === layer.id);
      const visible = updated ? updated.checked : layer.visible;
      const opacityUpdated = bookmarkOpacityVisibility.opacityChanges.find(o => o.id === layer.id);
      const opacity = opacityUpdated ? opacityUpdated.opacity : layer.opacity;
      return {
        ...layer,
        visible,
        opacity,
      };
    });
    return {
      ...mapResponse,
      layerTreeNodes: LayerTreeNodeHelper.getExtendedLayerTreeNodes(extendedTreeNodes, appLayers).map(node => {
        const matches = bookmarkLayerOrder.find(a => a.nodeId === node.id);
        if (matches !== undefined) {
          return {
            ...node,
            childrenIds: matches.children,
          };
        }
        return node;
      }),
      appLayers,
    };
  }

}
