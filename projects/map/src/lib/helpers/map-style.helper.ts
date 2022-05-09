import Style, { StyleFunction } from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import RegularShape from 'ol/style/RegularShape';
import { MapStyleModel, OlMapStyleType } from '../models';
import CircleStyle from 'ol/style/Circle';
import { FeatureModel } from '@tailormap-viewer/api';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
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

  public static getStyle(styleConfig?: MapStyleModel | ((feature: FeatureModel) => MapStyleModel)): OlMapStyleType {
    if (typeof styleConfig === 'undefined') {
      return MapStyleHelper.DEFAULT_STYLE;
    }
    if (typeof styleConfig === 'function') {
      return (feature: Feature<Geometry> | RenderFeature) => {
        if (feature instanceof RenderFeature) {
          return MapStyleHelper.DEFAULT_STYLE;
        }
        const featureModel = FeatureHelper.getFeatureModelForFeature(feature);
        if (!featureModel) {
          return MapStyleHelper.DEFAULT_STYLE;
        }
        return MapStyleHelper.mapStyleModelToOlStyle(styleConfig(featureModel));
      };
    }
    return MapStyleHelper.mapStyleModelToOlStyle(styleConfig);
  }

  private static mapStyleModelToOlStyle(styleConfig: MapStyleModel) {
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
    return style;
  }

}
