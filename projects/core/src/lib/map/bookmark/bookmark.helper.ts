import { MapSizeHelper, MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';

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
}
