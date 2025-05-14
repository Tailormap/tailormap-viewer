import { MapStyleModel, OlMapStyleType } from '../models';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { default as RenderFeature } from 'ol/render/Feature';
import { FeatureHelper } from './feature.helper';
import { ColorHelper, StyleHelper } from '@tailormap-viewer/shared';
import { Style, Fill, Stroke } from 'ol/style';
import { WKT } from 'ol/format';
import { FillStyleHelper } from './style/fill-style.helper';
import { ArrowStyleHelper } from './style/arrow-style.helper';
import { UnitsHelper } from './style/units.helper';
import { IconStyleHelper } from './style/icon-style.helper';
import { SelectionStyleHelper } from './style/selection-style.helper';
import { LabelStyleHelper } from './style/label-style.helper';
import { MeasureStyleHelper } from './style/measure-style.helper';

export class MapStyleHelper {

  private static wktParser = new WKT();

  private static DEFAULT_COLOR = '#cc0000';
  private static DEFAULT_SYMBOL_SIZE = 5;

  private static DEFAULT_STYLE = MapStyleHelper.mapStyleModelToOlStyle({
    styleKey: 'DEFAULT_STYLE',
    zIndex: 0,
    strokeColor: MapStyleHelper.DEFAULT_COLOR,
    pointType: 'square',
    pointFillColor: MapStyleHelper.DEFAULT_COLOR,
  });

  public static getStyle<T extends FeatureModelAttributes = FeatureModelAttributes>(styleConfig?: MapStyleModel | ((feature: FeatureModel<T>) => MapStyleModel)): OlMapStyleType {
    if (typeof styleConfig === 'undefined') {
      return MapStyleHelper.DEFAULT_STYLE;
    }
    return (feature: Feature<Geometry> | RenderFeature, resolution: number) => {
      if (feature instanceof RenderFeature) {
        return MapStyleHelper.DEFAULT_STYLE;
      }
      let style: MapStyleModel | undefined;
      if (typeof styleConfig === 'function') {
        const featureModel = FeatureHelper.getFeatureModelForFeature<T>(feature);
        if (!featureModel) {
          return MapStyleHelper.DEFAULT_STYLE;
        }
        style = styleConfig(featureModel);
      } else {
        style = styleConfig;
      }
      return MapStyleHelper.mapStyleModelToOlStyle(style, feature, resolution);
    };
  }

  public static mapStyleModelToOlStyle(styleConfig: MapStyleModel, feature?: Feature<Geometry>, resolution?: number) {
    const baseStyle = new Style();
    const stroke = MapStyleHelper.createStroke(styleConfig);
    if (stroke) {
      baseStyle.setStroke(stroke);
    }
    const fill = MapStyleHelper.createFill(styleConfig, UnitsHelper.getOpacity(styleConfig.fillOpacity, !!styleConfig.buffer));
    if (fill) {
      baseStyle.setFill(fill);
    }
    if (styleConfig.fillColor) {
      baseStyle.setFill(new Fill({
        color: styleConfig.stripedFill
          ? FillStyleHelper.createFillPattern(styleConfig.fillColor, styleConfig.fillOpacity)
          : ColorHelper.getRgbStyleForColor(styleConfig.fillColor, styleConfig.fillOpacity),
      }));
    }
    const styles: Style[] = [baseStyle];
    if (styleConfig.pointType) {
      styles.push(...IconStyleHelper.createShape(styleConfig.pointType, styleConfig, MapStyleHelper.DEFAULT_COLOR, MapStyleHelper.DEFAULT_SYMBOL_SIZE));
    }
    styles.push(...ArrowStyleHelper.createArrowStyles(styleConfig, feature, baseStyle.getStroke()));
    if (styleConfig.label) {
      styles.push(...LabelStyleHelper.createLabelStyle(styleConfig, MapStyleHelper.DEFAULT_SYMBOL_SIZE, feature));
    }
    if (styleConfig.isSelected && (!styleConfig.pointType || (!!styleConfig.pointType && !styleConfig.label)) && typeof feature !== 'undefined') {
      styles.push(...SelectionStyleHelper.createOutlinedSelectionRectangle(feature, resolution));
    }
    if (typeof styleConfig.buffer !== 'undefined' && styleConfig.buffer && typeof feature !== 'undefined') {
      styles.push(...MapStyleHelper.createBuffer(styleConfig.buffer, styleConfig));
    }
    return styles;
  }

  private static createStroke(styleConfig: MapStyleModel, overrideOpacity?: number) {
    if (!styleConfig.strokeColor) {
      return null;
    }
    const dash = StyleHelper.getDashArray(styleConfig.strokeType, styleConfig.strokeWidth);
    const stroke = new Stroke({
      color: ColorHelper.getRgbStyleForColor(styleConfig.strokeColor, overrideOpacity || styleConfig.strokeOpacity),
      width: styleConfig.strokeWidth || 1,
    });
    if (dash.length > 0) {
      stroke.setLineDash(dash);
      stroke.setLineCap(styleConfig.strokeType === 'dot' ? 'round' : 'square');
    }
    return stroke;
  }

  private static createFill(styleConfig: MapStyleModel, overrideOpacity?: number) {
    if (!styleConfig.fillColor) {
      return null;
    }
    return new Fill({
      color: styleConfig.stripedFill
        ? FillStyleHelper.createFillPattern(styleConfig.fillColor, overrideOpacity || styleConfig.fillOpacity)
        : ColorHelper.getRgbStyleForColor(styleConfig.fillColor, overrideOpacity || styleConfig.fillOpacity),
    });
  }

  private static createBuffer(buffer: string, config: MapStyleModel) {
    const bufferStyle = new Style({
      geometry: MapStyleHelper.wktParser.readGeometry(buffer),
    });
    const fill = MapStyleHelper.createFill(config, UnitsHelper.getOpacity(config.fillOpacity, true));
    if (fill) {
      bufferStyle.setFill(fill);
    }
    const stroke = MapStyleHelper.createStroke(config, UnitsHelper.getOpacity(config.strokeOpacity, true));
    if (stroke) {
      bufferStyle.setStroke(stroke);
    }
    return [bufferStyle];
  }

}
