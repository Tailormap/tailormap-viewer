import { Feature } from 'ol';
import { Geometry, Polygon } from 'ol/geom';
import { Stroke, Style } from 'ol/style';
import { buffer as bufferExtent } from 'ol/extent';
import { MapStyleModel } from '../../models/map-style.model';
import { ImageStyleHelper } from './image-style.helper';

export class SelectionStyleHelper {

  public static createOutlinedSelectionRectangle(
    feature: Feature<Geometry>,
    resolution?: number,
    translate?: number[],
    styleConfig?: MapStyleModel,
  ): Style[] {
    const rect: Style | null = SelectionStyleHelper.createSelectionRectangle(feature, resolution, translate, styleConfig);
    return rect ? [rect] : [];
  }

  public static getSelectionRectangleBuffer(resolution?: number, baseSize: number = 10): number {
    return typeof resolution !== "undefined" ? baseSize * resolution : 4;
  }

  private static createSelectionRectangle(
    feature: Feature<Geometry>,
    resolution?: number,
    translate?: number[],
    styleConfig?: MapStyleModel,
  ) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return null;
    }
    let baseSize = 10;
    let extent = geometry.getExtent();
    if (styleConfig && styleConfig.pointType && styleConfig.pointSize && !styleConfig.pointImage) {
      // Make base size dependent on point type and size, default size = 5, so we subtract 5 from point size
      // Minimum base size is 0, so we use Math.max to ensure it does not go below 0
      baseSize = Math.max(0, (styleConfig.pointSize - 5)) + baseSize;
    }
    if (styleConfig && styleConfig.pointImage && styleConfig.pointImageWidth && styleConfig.pointImageHeight) {
      // For images take the width and height, multiply by resolution and use that to increase the extent
      const [ width, height ] = ImageStyleHelper.getPointImageSize(styleConfig).map(s => s * (resolution ?? 1));
      extent = [ extent[0] - width / 2, extent[1] - height / 2, extent[2] + width / 2, extent[3] + height / 2 ];
    }
    const buffer = SelectionStyleHelper.getSelectionRectangleBuffer(resolution, baseSize);
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
      color: [ 255, 0, 0, 1 ], width: 1, lineDash: [ 4, 4 ],
    });
  }

}
