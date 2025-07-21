import { MapStyleModel, OlMapStyleType } from '../models';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Feature } from 'ol';
import {
  Geometry, Circle as CircleGeometry, LinearRing, LineString, MultiLineString, MultiPoint, MultiPolygon, Polygon, Point,
} from 'ol/geom';
import { default as RenderFeature } from 'ol/render/Feature';
import { FeatureHelper } from './feature.helper';
import { ColorHelper } from '@tailormap-viewer/shared';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { FillStyleHelper } from './style/fill-style.helper';
import { ArrowStyleHelper } from './style/arrow-style.helper';
import { UnitsHelper } from './style/units.helper';
import { IconStyleHelper } from './style/icon-style.helper';
import { SelectionStyleHelper } from './style/selection-style.helper';
import { LabelStyleHelper } from './style/label-style.helper';
import { MeasureStyleHelper } from './style/measure-style.helper';
import { OL3Parser } from 'jsts/org/locationtech/jts/io';
import { GeometryTypeHelper } from './geometry-type.helper';
import { BufferOp } from 'jsts/org/locationtech/jts/operation/buffer';
import { ImageStyleHelper } from './style/image-style.helper';
import { StrokeStyleHelper } from './style/stroke-style.helper';

export class MapStyleHelper {

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
    const baseZIndex = styleConfig.zIndex || 0;
    const baseStyle = new Style({ zIndex: baseZIndex });
    const stroke = StrokeStyleHelper.createStroke(styleConfig);
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
    let symbolSizeForLabel = styleConfig.pointSize ?? MapStyleHelper.DEFAULT_SYMBOL_SIZE;
    if (styleConfig.pointImage) {
      symbolSizeForLabel = ImageStyleHelper.getSymbolSizeForLabel(styleConfig);
      styles.push(ImageStyleHelper.getPointImageStyle(styleConfig));
    } else if (styleConfig.pointType) {
      styles.push(...IconStyleHelper.createShape(styleConfig.pointType, styleConfig, MapStyleHelper.DEFAULT_COLOR, MapStyleHelper.DEFAULT_SYMBOL_SIZE));
    }
    styles.push(...ArrowStyleHelper.createArrowStyles(styleConfig, feature, stroke, baseZIndex));
    if (styleConfig.label) {
      styles.push(...LabelStyleHelper.createLabelStyle(styleConfig, symbolSizeForLabel, MapStyleHelper.DEFAULT_SYMBOL_SIZE, feature, baseZIndex));
    }
    if (styleConfig.isSelected && (!styleConfig.pointType || (!!styleConfig.pointType && !styleConfig.label)) && typeof feature !== 'undefined') {
      styles.push(...SelectionStyleHelper.createOutlinedSelectionRectangle(feature, resolution, undefined, styleConfig));
    }
    if (typeof styleConfig.buffer !== 'undefined' && styleConfig.buffer && typeof feature !== 'undefined') {
      styles.push(...MapStyleHelper.createBuffer(feature, styleConfig.buffer, styleConfig));
    }
    if (feature && (styleConfig.showSegmentSize || styleConfig.showTotalSize)) {
      styles.push(...MeasureStyleHelper.addMeasures(feature, styleConfig.showTotalSize, styleConfig.showSegmentSize));
    }
    if (styleConfig.showVertices) {
      styles.push(MapStyleHelper.getVertices(styleConfig.strokeColor || MapStyleHelper.DEFAULT_COLOR, styleConfig.strokeWidth ?? 1));
    }
    if (styleConfig.secondaryStroke) {
      styles.push(...StrokeStyleHelper.getAdditionalStroke(styleConfig, styleConfig.secondaryStroke, baseZIndex, feature, resolution));
    }
    if (styleConfig.tertiaryStroke) {
      styles.push(...StrokeStyleHelper.getAdditionalStroke(styleConfig, styleConfig.tertiaryStroke, baseZIndex, feature, resolution));
    }
    return styles;
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

  private static createBuffer(feature: Feature<Geometry>, buffer: number, config: MapStyleModel) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return [];
    }
    let bufferedGeometry: Geometry | undefined;
    if (GeometryTypeHelper.isCircleGeometry(geometry) || GeometryTypeHelper.isPointGeometry(geometry)) {
      const center = GeometryTypeHelper.isPointGeometry(geometry)
        ? geometry.getCoordinates()
        : geometry.getCenter();
      const radius = GeometryTypeHelper.isCircleGeometry(geometry)
        ? geometry.getRadius()
        : 0;
      bufferedGeometry = new CircleGeometry(center, radius + buffer);
    } else {
      const parser = new OL3Parser();
      parser.inject(Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon);
      const buffered = BufferOp.bufferOp(parser.read(geometry), buffer);
      bufferedGeometry = parser.write(buffered);
    }
    if (!bufferedGeometry) {
      return [];
    }
    const bufferStyle = new Style({
      geometry: bufferedGeometry,
    });
    const fill = MapStyleHelper.createFill(config, UnitsHelper.getOpacity(config.fillOpacity, true));
    if (fill) {
      bufferStyle.setFill(fill);
    }
    const stroke = StrokeStyleHelper.createStroke(config, UnitsHelper.getOpacity(config.strokeOpacity, true));
    if (stroke) {
      bufferStyle.setStroke(stroke);
    }
    return [bufferStyle];
  }

  private static getVertices(color: string, strokeWidth: number) {
    return new Style({
      image: new Circle({
        radius: strokeWidth + 2,
        stroke: new Stroke({ color, width: 2 }),
        fill: new Fill({ color: 'white' }),
      }),
      geometry: function (feature) {
        const featureGeom = feature.getGeometry();
        if (featureGeom && (featureGeom instanceof Polygon || featureGeom instanceof LineString)) {
          const coordinates = featureGeom.getCoordinates()[0];
          return new MultiPoint(coordinates);
        }
        return undefined;
      },
    });
  }

}
