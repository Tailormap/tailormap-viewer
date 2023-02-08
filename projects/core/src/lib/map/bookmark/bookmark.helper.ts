import { ArrayHelper } from '@tailormap-viewer/shared';
import { MapSizeHelper, MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';
import { TristateBoolean, LayerVisibilityBookmarkFragment, LayerInformation, LayerTreeOrderBookmarkFragment, LayerTreeOrderInformation } from './bookmark_pb';
import { AppLayerWithInitialValuesModel, ExtendedLayerTreeNodeModel } from '../models';

export interface MapBookmarkContents {
  visibilityChanges: { id: number; checked: boolean }[];
  opacityChanges: { layerId: number; opacity: number }[];
}

export class MapBookmarkHelper {
  public static locationAndZoomFromFragment(fragment: string, viewDetails: MapViewDetailsModel, unitsOfMeasure: MapUnitEnum): [[number, number], number] | undefined {
    const parts = fragment.split(',');
    if (parts.length !== 3) {
      return undefined;
    }

    let center: [number, number] = [ parseFloat(parts[0]), parseFloat(parts[1]) ];
    let zoom = parseFloat(parts[2]);

    if (!isFinite(center[0]) || !isFinite(center[1]) || !isFinite(zoom)) {
      return undefined;
    }

    if (viewDetails.center !== undefined) {
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
  ): MapBookmarkContents {
    let id = -1;
    const checkedVisibilityValues = new Set();
    const checkedOpacityValues = new Set();

    const visibilityData = [];
    const opacityData = [];

    for (const layer of fragment.layers) {
      id = layer.relativeId + id + 1;

      const currentLayer = layers.find(a => a.id === id);
      if (currentLayer === undefined) { continue; }

      if (layer.visible !== TristateBoolean.UNSET) {
        checkedVisibilityValues.add(id);
        const isLayerVisible = layer.visible === TristateBoolean.TRUE;
        if (isLayerVisible !== currentLayer.visible) {
          visibilityData.push({ id, checked: isLayerVisible });
        }
      }

      if (layer.opacity !== 0) {
        const opacity = layer.opacity - 1;
        checkedOpacityValues.add(id);
        if (opacity !== currentLayer.opacity) {
          opacityData.push({ layerId: id, opacity });
        }
      }
    }

    for (const layer of layers) {
      const currentLayer = layers.find(a => a.id === layer.id);
      if (currentLayer === undefined) { continue; }

      if (!checkedVisibilityValues.has(layer.id) && currentLayer.initialValues?.visible !== currentLayer.visible) {
        visibilityData.push({ id: layer.id, checked: currentLayer.initialValues?.visible ?? true });
      }

      if (!checkedOpacityValues.has(layer.id) && currentLayer.initialValues?.opacity !== currentLayer.opacity) {
        opacityData.push({ layerId: layer.id, opacity: currentLayer.initialValues?.opacity ?? 100 });
      }
    }

    return { visibilityChanges: visibilityData, opacityChanges: opacityData };
  }

  public static fragmentFromVisibilityData(layers: AppLayerWithInitialValuesModel[]): LayerVisibilityBookmarkFragment {
    const newLayers = new Map<number, LayerInformation>();
    for (const layer of layers) {
      const info = new LayerInformation();
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
        newLayers.set(layer.id, info);
      }
    }

    const sortedKeys = [...newLayers.keys()].sort((a, b) => a - b);
    const bookmarkData = new LayerVisibilityBookmarkFragment();
    let previousId = -1;
    for (const key of sortedKeys) {
      const layer = newLayers.get(key);
      if (layer === undefined) { continue; }

      layer.relativeId = key - previousId - 1;
      previousId = key;

      bookmarkData.layers.push(layer);
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
  ): { nodeId: string; children: string[] }[] {
    const output = [];

    for (const layer of layers) {
       const newChildren = fragment.ordering[layer.id]?.children?.filter(a => layers.some(b => b.id === a)) ?? layer.initialChildren;
       if (!ArrayHelper.arrayEquals(layer.childrenIds ?? [], newChildren)) {
         output.push({ nodeId: layer.id, children: newChildren });
       }
    }

    return output;
  }

}
