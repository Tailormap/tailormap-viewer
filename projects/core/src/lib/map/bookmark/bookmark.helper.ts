import { MapSizeHelper, MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';
import { AppLayerModel } from '@tailormap-viewer/api';
import { TristateBoolean, LayerVisibilityBookmarkFragment, LayerInformation } from './bookmark_pb';

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

  public static visibilityDataFromFragment(fragment: LayerVisibilityBookmarkFragment, layers: AppLayerModel[], initiallyVisible: number[]): { id: number; checked: boolean }[] {
    let id = -1;
    const checkedValues = new Set();
    const visibilityData = [];
    for (const layer of fragment.layers) {
      id = layer.relativeId + id + 1;

      checkedValues.add(id);

      if (layer.visible === TristateBoolean.UNSET) {
        continue;
      }

      const currentLayer = layers.find(a => a.id === id);
      if (currentLayer === undefined) { continue; }

      const isLayerVisible = layer.visible === TristateBoolean.TRUE;
      if (isLayerVisible === currentLayer.visible) { continue; }

      visibilityData.push({ id, checked: isLayerVisible });
    }

    for (const layer of layers) {
      if (checkedValues.has(layer.id)) { continue; }

      const currentLayer = layers.find(a => a.id === layer.id);
      if (currentLayer === undefined) { continue; }

      const layerInitiallyVisible = initiallyVisible.find(a => a === layer.id) !== undefined;
      if (layerInitiallyVisible === currentLayer.visible) { continue; }
      visibilityData.push({ id: layer.id, checked: layerInitiallyVisible });
    }

    return visibilityData;
  }

  public static fragmentFromVisibilityData(initiallyVisible: number[], layers: AppLayerModel[]): LayerVisibilityBookmarkFragment {
    const newLayers = new Map<number, LayerInformation>();
    for (const layer of layers) {
      const wasVisible = initiallyVisible.find(a => a === layer.id) !== undefined;

      if (wasVisible !== layer.visible) {
        newLayers.set(layer.id, new LayerInformation({
          visible: layer.visible ? TristateBoolean.TRUE : TristateBoolean.FALSE,
        }));
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
}
