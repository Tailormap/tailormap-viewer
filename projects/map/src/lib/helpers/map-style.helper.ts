import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import { default as RegularShape, Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { MapStyleModel, MapStylePointType, OlMapStyleType } from '../models';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import Feature from 'ol/Feature';
import { Geometry, Point, Polygon } from 'ol/geom';
import { forEach as forEachSegments } from 'ol/geom/flat/segments';
import { buffer as bufferExtent } from 'ol/extent';
import RenderFeature from 'ol/render/Feature';
import { FeatureHelper } from './feature.helper';
import { ColorHelper, StyleHelper } from '@tailormap-viewer/shared';
import { Icon } from 'ol/style';
import { GeometryTypeHelper } from './geometry-type.helper';
import { MapSizeHelper } from '../helpers/map-size.helper';

export class MapStyleHelper {

  private static DEFAULT_COLOR = '#cc0000';
  private static DEFAULT_SYMBOL_SIZE = 5;
  private static DEFAULT_FONT_SIZE = 12;
  private static DEFAULT_LABEL_COLOR = '#000000';

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
    const baseStyle = new Style();
    if (styleConfig.strokeColor) {
      const dash = StyleHelper.getDashArray(styleConfig.strokeType, styleConfig.strokeWidth);
      const stroke = new Stroke({
        color: ColorHelper.getRgbStyleForColor(styleConfig.strokeColor, styleConfig.strokeOpacity),
        width: styleConfig.strokeWidth || 1,
      });
      if (dash.length > 0) {
        stroke.setLineDash(dash);
        stroke.setLineCap(styleConfig.strokeType === 'dot' ? 'round' : 'square');
      }
      baseStyle.setStroke(stroke);
    }
    if (styleConfig.fillColor) {
      baseStyle.setFill(new Fill({
        color: ColorHelper.getRgbStyleForColor(styleConfig.fillColor, styleConfig.fillOpacity),
      }));
    }
    const styles: Style[] = [ baseStyle ];
    if (styleConfig.pointType) {
      styles.push(...MapStyleHelper.createShape(styleConfig.pointType, styleConfig));
    }
    styles.push(...MapStyleHelper.createArrowStyles(styleConfig, feature, baseStyle.getStroke()));
    if (styleConfig.label) {
      const symbolSize = MapStyleHelper.getNumberValue(styleConfig.pointSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
      const geom = feature?.getGeometry();
      const label = MapStyleHelper.replaceSpecialValues(styleConfig.label, geom);
      const labelSize = MapStyleHelper.getNumberValue(styleConfig.labelSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
      const scale = 1 + (labelSize / MapStyleHelper.DEFAULT_FONT_SIZE);
      const offsetY = styleConfig.pointType === 'label'
        ? 0
        : 14 + (symbolSize - MapStyleHelper.DEFAULT_SYMBOL_SIZE) + (scale * 2);
      styles.push(new Style({
        text: new Text({
          placement: GeometryTypeHelper.isLineGeometry(geom) ? 'line' : '',
          text: label,
          fill: new Fill({
            color: styleConfig.labelColor || MapStyleHelper.DEFAULT_LABEL_COLOR,
          }),
          offsetY,
          scale,
        }),
      }));
    }
    if (styleConfig.isSelected && typeof feature !== 'undefined') {
      const buffer = !!styleConfig.label ? 1.6 : 1.3;
      styles.push(...MapStyleHelper.createOutlinedSelectionRectangle(feature, buffer * (resolution || 0)));
    }
    return styles;
  }

  private static replaceSpecialValues(label: string, geometry?: Geometry) {
    if (label.indexOf('[COORDINATES]') !== -1) {
      const coordinatesLabel = GeometryTypeHelper.isPointGeometry(geometry) ? geometry.getCoordinates().join(' ') : '';
      label = label.replace(/\[COORDINATES]/g, coordinatesLabel);
    }
    if (label.indexOf('[LENGTH]') !== -1 || label.indexOf('[AREA]') !== -1) {
      label = label.replace(/\[LENGTH|AREA]/g, MapSizeHelper.getFormattedSize(geometry));
    }
    return label;
  }

  private static createShape(type: MapStylePointType, styleConfig: MapStyleModel): Style[] {
    if (type === 'label') {
      return [];
    }
    const symbolSize = MapStyleHelper.getNumberValue(styleConfig.pointSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
    const fillColor = styleConfig.pointFillColor || MapStyleHelper.DEFAULT_COLOR;
    const strokeColor = styleConfig.pointStrokeColor || MapStyleHelper.DEFAULT_COLOR;
    const strokeWidth = MapStyleHelper.getNumberValue(styleConfig.pointStrokeWidth, 1);
    if (type === 'cross' || type === 'arrow' || type === 'diamond') {
      const svgStrokeWidth = 1 + (strokeWidth / 10);
      const path = type === 'arrow'
        ? 'M0 6.75v-3.5h5.297V0L10 5l-4.703 5V6.75H0Z'
        : type === 'diamond'
          ? 'm5 0 3.5 4.997L5 10 1.5 4.997 5 0Z'
          : 'M7.026 3V.015h-4V3H.005v4h3.021v3.006h4V7h2.969V3H7.026Z';
      const icon = [
        `<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`,
        `<path d="${path}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${svgStrokeWidth}" />`,
        '</svg>',
      ].join('');
      return [
        new Style({
          image: new Icon({
            src: 'data:image/svg+xml;base64,' + btoa(icon),
            scale: (symbolSize + svgStrokeWidth) / 6,
            rotation: MapStyleHelper.getRotationForDegrees(styleConfig.pointRotation),
          }),
        }),
      ];
    }
    const POINT_SHAPES: Record<string, RegularShapeOptions> = {
      circle: { points: Infinity, radius: symbolSize },
      star: { points: 5, radius: symbolSize, radius2: symbolSize * .4, angle: 0 },
      square: { points: 4, radius: symbolSize, angle: Math.PI / 4 },
      triangle: { points: 3, radius: symbolSize, angle: 0 },
      diamond: { points: 4, radius: symbolSize, angle: Math.PI / 2 },
    };
    const baseShape = new RegularShape({
      fill: new Fill({ color:fillColor  }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      rotation: MapStyleHelper.getRotationForDegrees(styleConfig.pointRotation),
      ...POINT_SHAPES[type],
    });
    return [ new Style({ image: baseShape }) ];
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

  private static getNumberValue(nr: number | undefined, defaultValue: number): number {
    if (typeof nr === 'undefined') {
      return defaultValue;
    }
    return nr;
  }

  private static getRotationForDegrees(degrees?: number): number {
    if (!degrees) {
      return degrees || 0;
    }
    return degrees / (180 / Math.PI);
  }

  private static createArrowStyles(styleConfig: MapStyleModel, feature?: Feature<Geometry>, strokeStyle?: Stroke): Style[] {
    if (!feature
      || !strokeStyle
      || !styleConfig.arrowType
      || styleConfig.arrowType === 'none'
    ) {
      return [];
    }
    const geometry = feature.getGeometry();
    if (!geometry || !GeometryTypeHelper.isLineGeometry(geometry)) {
      return [];
    }
    const arrows = [];
    const flatCoords = geometry.getFlatCoordinates();
    let lastSegment: [ number[], number[] ] | [] = [];
    forEachSegments(flatCoords, 0, flatCoords.length, geometry.getStride(), (start, end) => {
      if (lastSegment.length === 0
        && (styleConfig.arrowType === 'start' || styleConfig.arrowType === 'both')) {
        arrows.push(MapStyleHelper.createArrow({
          zIndex: styleConfig.zIndex,
          arrowStart: end,
          arrowEnd: start,
          strokeStyle,
          styleConfig,
        }));
      }
      if (styleConfig.arrowType === 'along') {
        const x = (start[0] + end[0]) / 2;
        const y = (start[1] + end[1]) / 2;
        arrows.push(MapStyleHelper.createArrow({
          zIndex: styleConfig.zIndex,
          arrowStart: start,
          arrowEnd: end,
          strokeStyle,
          pointCoordinates: [ x, y ],
          styleConfig,
        }));
      }
      lastSegment = [[...start], [...end]];
    });
    if (lastSegment.length !== 0
      && (
        styleConfig.arrowType === 'end'
        || styleConfig.arrowType === 'both'
        || styleConfig.arrowType === 'along'
      )) {
      arrows.push(MapStyleHelper.createArrow({
        zIndex: styleConfig.zIndex,
        arrowStart: lastSegment[0],
        arrowEnd: lastSegment[1],
        strokeStyle,
        styleConfig,
      }));
    }
    return arrows;
  }

  private static createArrow(args: {
    zIndex: number;
    arrowStart: number[];
    arrowEnd: number[];
    strokeStyle: Stroke;
    pointCoordinates?: number[];
    styleConfig: MapStyleModel;
  }): Style {
    const dx = args.arrowEnd[0] - args.arrowStart[0];
    const dy = args.arrowEnd[1] - args.arrowStart[1];
    const arrowAngle  = Math.atan2(dy, dx);
    // let outlineStroke;
    // if (args.styleConfig.lineOutline) {
    //   const outlineRgb = getRgbForColor(args.styleConfig.lineOutline);
    //   outlineStroke = new Stroke({
    //     color: `rgba(${outlineRgb.r}, ${outlineRgb.g}, ${outlineRgb.b}, ${args.styleConfig.strokeOpacity})`,
    //     width: 1,
    //   });
    // }
    return new Style({
      geometry: new Point(args.pointCoordinates || args.arrowEnd),
      image: new RegularShape({
        fill: new Fill({ color: args.strokeStyle.getColor() }),
        // stroke: outlineStroke,
        points: 3,
        radius: Math.max(1, args.strokeStyle.getWidth() || 1) + 5,
        angle: Math.PI / 2,
        rotation: -arrowAngle,
      }),
      zIndex: args.zIndex + 1,
    });
  }

}
