import { Feature } from 'ol';
import { Geometry, Polygon } from 'ol/geom';
import { Stroke, Style } from 'ol/style';
import { buffer as bufferExtent } from 'ol/extent';

export class SelectionStyleHelper {

  public static createOutlinedSelectionRectangle(feature: Feature<Geometry>, resolution?: number, translate?: number[]): Style[] {
    const buffer = SelectionStyleHelper.getSelectionRectangleBuffer(resolution);
    const rect: Style | null = SelectionStyleHelper.createSelectionRectangle(feature, buffer, translate);
    if (!rect) {
      return [];
    }
    rect.setStroke(SelectionStyleHelper.getSelectionStroke());
    return [rect];
  }

  public static getSelectionRectangleBuffer(resolution?: number) {
    return typeof resolution !== "undefined" ? 10 * resolution : 4;
  }

  private static createSelectionRectangle(feature: Feature<Geometry>, buffer: number, translate?: number[]) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return null;
    }
    const extent = geometry.getExtent();
    const bufferedExtent = bufferExtent(extent, buffer);
    const rect = new Polygon([[
      [ bufferedExtent[0], bufferedExtent[1] ],
      [ bufferedExtent[0], bufferedExtent[3] ],
      [ bufferedExtent[2], bufferedExtent[3] ],
      [ bufferedExtent[2], bufferedExtent[1] ],
      [ bufferedExtent[0], bufferedExtent[1] ],
    ]]);
    if (translate) {
      rect.translate(translate[0], translate[1]);
    }
    return new Style({
      geometry: rect,
      stroke: SelectionStyleHelper.getSelectionStroke(),
      zIndex: Infinity,
    });
  }

  public static getSelectionStroke() {
    return new Stroke({
      color: [ 255, 0, 0, 1 ], width: 2, lineDash: [ 4, 4 ],
    });
  }

}
