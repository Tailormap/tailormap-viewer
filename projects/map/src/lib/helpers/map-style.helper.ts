import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import RegularShape from 'ol/style/RegularShape';
import { MapStyleModel, OlMapStyleType } from '../models';
import CircleStyle from 'ol/style/Circle';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import Feature from 'ol/Feature';
import { Geometry, Polygon } from 'ol/geom';
import { buffer as bufferExtent } from 'ol/extent';
import RenderFeature from 'ol/render/Feature';
import { FeatureHelper } from './feature.helper';

export class MapStyleHelper {

  private static DEFAULT_COLOR = '#cc0000';

  private static POINT_SHAPES = {
    star: { points: 5, radius: 10, radius2: 4, angle: 0 },
    cross: { points: 4, radius: 10, radius2: 0, angle: 0 },
    square: { points: 4, radius: 10, angle: Math.PI / 4 },
    triangle: { points: 3, radius: 10, rotation: Math.PI / 4, angle: 0 },
  };

  private static DEFAULT_STYLE = MapStyleHelper.mapStyleModelToOlStyle({
    styleKey: 'DEFAULT_STYLE',
    strokeColor: MapStyleHelper.DEFAULT_COLOR,
    pointType: 'square',
    pointFillColor: MapStyleHelper.DEFAULT_COLOR,
  });

  public static getStyle<T extends FeatureModelAttributes = FeatureModelAttributes>(styleConfig?: MapStyleModel | ((feature: FeatureModel<T>) => MapStyleModel)): OlMapStyleType {
    if (typeof styleConfig === 'undefined') {
      return MapStyleHelper.DEFAULT_STYLE;
    }
    if (typeof styleConfig === 'function') {
      return (feature: Feature<Geometry> | RenderFeature, resolution: number) => {
        if (feature instanceof RenderFeature) {
          return MapStyleHelper.DEFAULT_STYLE;
        }
        const featureModel = FeatureHelper.getFeatureModelForFeature<T>(feature);
        if (!featureModel) {
          return MapStyleHelper.DEFAULT_STYLE;
        }
        return MapStyleHelper.mapStyleModelToOlStyle(styleConfig(featureModel), feature, 20 * resolution);
      };
    }
    return MapStyleHelper.mapStyleModelToOlStyle(styleConfig);
  }

  private static mapStyleModelToOlStyle(styleConfig: MapStyleModel, feature?: Feature<Geometry>, resolution?: number) {
    const style = new Style();
    if (styleConfig.strokeColor) {
      style.setStroke(new Stroke({ color: styleConfig.strokeColor, width: styleConfig.strokeWidth || 1 }));
    }
    if (styleConfig.fillColor) {
      style.setFill(new Fill({ color: styleConfig.fillColor }));
    }
    if (styleConfig.pointType) {
      const pointFill = new Fill({ color: styleConfig.pointFillColor || MapStyleHelper.DEFAULT_COLOR });
      const pointStroke = new Stroke({ color: styleConfig.pointStrokeColor || MapStyleHelper.DEFAULT_COLOR, width: 1 });
      const shape = styleConfig.pointType === 'circle'
        ? new CircleStyle({
          radius: 5,
          stroke: pointStroke,
          fill: pointFill,
        })
        : new RegularShape({
          stroke: pointStroke,
          fill: pointFill,
          ...MapStyleHelper.POINT_SHAPES[styleConfig.pointType],
        });
      style.setImage(shape);
    }
    if (styleConfig.isSelected && typeof feature !== 'undefined') {
      return [
        style,
        ...MapStyleHelper.createOutlinedSelectionRectangle(feature, 1.3 * (resolution || 0)),
      ];
    }
    return style;
  }

  private static createOutlinedSelectionRectangle(feature: Feature<Geometry>, buffer: number, translate?: number[]): Style[] {
    const outer: Style | null = MapStyleHelper.createSelectionRectangle(feature, buffer, translate);
    if (!outer) {
      return [];
    }
    const inner = outer.clone();
    outer.setStroke(MapStyleHelper.getSelectionStroke(true));
    inner.setStroke(MapStyleHelper.getSelectionStroke(false));
    return [
      outer,
      inner,
    ];
  }

  private static createSelectionRectangle(feature: Feature<Geometry>, buffer: number, translate?: number[]) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return null;
    }
    const extent = geometry.getExtent();
    const bufferedExtent = bufferExtent(extent, buffer);
    const rect = new Polygon([[
      [bufferedExtent[0], bufferedExtent[1]],
      [bufferedExtent[0], bufferedExtent[3]],
      [bufferedExtent[2], bufferedExtent[3]],
      [bufferedExtent[2], bufferedExtent[1]],
      [bufferedExtent[0], bufferedExtent[1]],
    ]]);
    if (translate) {
      rect.translate(translate[0], translate[1]);
    }
    return new Style({
      geometry: rect,
      stroke: MapStyleHelper.getSelectionStroke(),
      zIndex: Infinity,
    });
  }

  private static getSelectionStroke(outer = false) {
    return new Stroke({
      color: outer ? '#fff' : '#333',
      lineCap: 'square',
      lineDash: [ 4, 10 ],
      width: outer ? 5 : 2.5,
    });
  }

}
