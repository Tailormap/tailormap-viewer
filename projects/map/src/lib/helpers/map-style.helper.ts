import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { MapStyleModel, MapStylePointType, OlMapStyleType } from '../models';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Feature } from 'ol';
import { Geometry, Point, Polygon } from 'ol/geom';
import { forEach as forEachSegments } from 'ol/geom/flat/segments';
import { buffer as bufferExtent } from 'ol/extent';
import { default as RenderFeature } from 'ol/render/Feature';
import { FeatureHelper } from './feature.helper';
import { ColorHelper, StyleHelper } from '@tailormap-viewer/shared';
import { RegularShape, Style, Icon, Fill, Stroke, Text } from 'ol/style';
import { GeometryTypeHelper } from './geometry-type.helper';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { WKT } from 'ol/format';

export class MapStyleHelper {

  private static wktParser = new WKT();

  private static DEFAULT_COLOR = '#cc0000';
  private static DEFAULT_SYMBOL_SIZE = 5;
  private static DEFAULT_FONT_SIZE = 12;
  private static DEFAULT_LABEL_COLOR = '#000000';
  private static BUFFER_OPACITY_DECREASE = 20;

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
        return MapStyleHelper.mapStyleModelToOlStyle(styleConfig(featureModel), feature);
      };
    }
    return MapStyleHelper.mapStyleModelToOlStyle(styleConfig);
  }

  private static mapStyleModelToOlStyle(styleConfig: MapStyleModel, feature?: Feature<Geometry>) {
    const baseStyle = new Style();
    const stroke = MapStyleHelper.createStroke(styleConfig);
    if (stroke) {
      baseStyle.setStroke(stroke);
    }
    const fill = MapStyleHelper.createFill(styleConfig, MapStyleHelper.getOpacity(styleConfig.fillOpacity, !!styleConfig.buffer));
    if (fill) {
      baseStyle.setFill(fill);
    }
    if (styleConfig.fillColor) {
      baseStyle.setFill(new Fill({
        color: styleConfig.stripedFill
          ? MapStyleHelper.createFillPattern(styleConfig.fillColor, styleConfig.fillOpacity)
          : ColorHelper.getRgbStyleForColor(styleConfig.fillColor, styleConfig.fillOpacity),
      }));
    }
    const styles: Style[] = [baseStyle];
    if (styleConfig.pointType) {
      styles.push(...MapStyleHelper.createShape(styleConfig.pointType, styleConfig));
    }
    styles.push(...MapStyleHelper.createArrowStyles(styleConfig, feature, baseStyle.getStroke()));
    if (styleConfig.label) {
      styles.push(...MapStyleHelper.createLabelStyle(styleConfig, feature));
    }
    if (styleConfig.isSelected && (!styleConfig.pointType || (!!styleConfig.pointType && !styleConfig.label)) && typeof feature !== 'undefined') {
      styles.push(...MapStyleHelper.createOutlinedSelectionRectangle(feature, 4));
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
        ? MapStyleHelper.createFillPattern(styleConfig.fillColor, overrideOpacity || styleConfig.fillOpacity)
        : ColorHelper.getRgbStyleForColor(styleConfig.fillColor, overrideOpacity || styleConfig.fillOpacity),
    });
  }

  private static createLabelStyle(styleConfig: MapStyleModel, feature?: Feature<Geometry>) {
    const symbolSize = MapStyleHelper.getNumberValue(styleConfig.pointSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
    const geom = feature?.getGeometry();
    const label = MapStyleHelper.replaceSpecialValues(styleConfig.label, geom);
    const labelSize = MapStyleHelper.getNumberValue(styleConfig.labelSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
    const scale = 1 + (labelSize / MapStyleHelper.DEFAULT_FONT_SIZE);
    const offsetY = styleConfig.pointType === 'label'
      ? 0
      : 14 + (symbolSize - MapStyleHelper.DEFAULT_SYMBOL_SIZE) + (scale * 2);

    const italic = (styleConfig.labelStyle || []).includes('italic');
    const bold = (styleConfig.labelStyle || []).includes('bold');
    const font = [
      italic ? 'italic' : undefined,
      bold ? 'bold' : undefined,
      '8px',
      'Inter, "Lucida Sans Unicode", "Lucida Grande", sans-serif',
    ].filter(Boolean).join(' ');

    const showSelectionRectangle = styleConfig.isSelected && !!styleConfig.pointType;
    const DEFAULT_SELECTION_PADDING = 10;
    const paddingTop: number = styleConfig.pointType === 'label'
      ? DEFAULT_SELECTION_PADDING
      : (styleConfig.pointType ? offsetY + symbolSize + DEFAULT_SELECTION_PADDING : 0);

    const baseLabelStyle = new Style({
      zIndex: styleConfig.zIndex,
      text: new Text({
        placement: GeometryTypeHelper.isLineGeometry(geom) ? 'line' : undefined,
        text: label,
        font,
        fill: new Fill({
          color: styleConfig.labelColor || MapStyleHelper.DEFAULT_LABEL_COLOR,
        }),
        rotation: MapStyleHelper.getRotationForDegrees(styleConfig.labelRotation),
        stroke: styleConfig.labelOutlineColor
          ? new Stroke({ color: styleConfig.labelOutlineColor, width: 2 })
          : undefined,
        offsetY,
        scale,
        backgroundStroke: showSelectionRectangle ? MapStyleHelper.getSelectionStroke(false) : undefined,
        padding: showSelectionRectangle
          ? [ paddingTop, DEFAULT_SELECTION_PADDING, DEFAULT_SELECTION_PADDING, DEFAULT_SELECTION_PADDING ]
          : undefined,
      }),
    });
    if (showSelectionRectangle) {
      const outerSelectionRectangle = baseLabelStyle.clone();
      outerSelectionRectangle.setZIndex(styleConfig.zIndex - 1);
      outerSelectionRectangle.getText()?.setBackgroundStroke(MapStyleHelper.getSelectionStroke(true));
      return [ baseLabelStyle, outerSelectionRectangle ];
    }
    return [baseLabelStyle];
  }

  private static replaceSpecialValues(label?: string, geometry?: Geometry) {
    label = label || '';
    if (label.indexOf('[COORDINATES]') !== -1) {
      const coordinatesLabel = GeometryTypeHelper.isPointGeometry(geometry) ? geometry.getCoordinates().join(' ') : '';
      label = label.replace(/\[COORDINATES]/g, coordinatesLabel);
    }
    if (label.indexOf('[LENGTH]') !== -1 || label.indexOf('[AREA]') !== -1) {
      label = label.replace(/\[(LENGTH|AREA)\]/g, MapSizeHelper.getFormattedSize(geometry));
    }
    return label;
  }

  private static getSvgIcon(props: {
    svgContent: string;
    symbolSize: number;
    strokeWidth: number;
    rotation?: number;
    shrinkFactor?: number;
  }) {
    const svgStrokeWidth = 1 + (props.strokeWidth / 10);
    const icon = [
      `<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`,
      ...props.svgContent,
      '</svg>',
    ].join('');
    return new Icon({
      src: 'data:image/svg+xml;base64,' + btoa(icon),
      scale: (props.symbolSize + svgStrokeWidth) / (props.shrinkFactor || 6),
      rotation: MapStyleHelper.getRotationForDegrees(props.rotation),
    });
  }

  private static getRegularShape(props: {
    symbolSize: number;
    fillColor: string;
    strokeColor?: string;
    strokeWidth: number;
    rotation?: number;
    type: 'circle' | 'star' | 'square' | 'triangle' | 'diamond';
  }) {
    const POINT_SHAPES: Record<string, RegularShapeOptions> = {
      circle: { points: Infinity, radius: props.symbolSize },
      star: { points: 5, radius: props.symbolSize, radius2: props.symbolSize * .4, angle: 0 },
      square: { points: 4, radius: props.symbolSize, angle: Math.PI / 4 },
      triangle: { points: 3, radius: props.symbolSize, angle: 0 },
      diamond: { points: 4, radius: props.symbolSize, angle: Math.PI / 2 },
    };
    return new RegularShape({
      fill: new Fill({ color: props.fillColor  }),
      stroke: props.strokeWidth === 0 || !props.strokeColor ? undefined : new Stroke({ color: props.strokeColor, width: props.strokeWidth }),
      rotation: MapStyleHelper.getRotationForDegrees(props.rotation),
      ...POINT_SHAPES[props.type],
    });
  }

  private static createShape(type: MapStylePointType, styleConfig: MapStyleModel): Style[] {
    if (type === 'label') {
      return [];
    }
    const symbolSize = MapStyleHelper.getNumberValue(styleConfig.pointSize, MapStyleHelper.DEFAULT_SYMBOL_SIZE);
    const fillColor = styleConfig.pointFillColor || MapStyleHelper.DEFAULT_COLOR;
    const strokeColor = styleConfig.pointStrokeColor || MapStyleHelper.DEFAULT_COLOR;
    const strokeWidth = MapStyleHelper.getNumberValue(styleConfig.pointStrokeWidth, 1);
    const rotation = styleConfig.pointRotation;
    if (type === 'cross' || type === 'arrow' || type === 'diamond') {
      const svgStrokeWidth = 1 + (strokeWidth / 10);
      const paths = {
        arrow: 'M0 6.75v-3.5h5.297V0L10 5l-4.703 5V6.75H0Z',
        diamond: 'm5 0 3.5 4.997L5 10 1.5 4.997 5 0Z',
        cross: 'M7.026 3V.015h-4V3H.005v4h3.021v3.006h4V7h2.969V3H7.026Z',
      };
      const svgContent = `<path d="${paths[type]}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${svgStrokeWidth}" />`;
      return [new Style({ image: MapStyleHelper.getSvgIcon({ svgContent,  symbolSize,  rotation,  strokeWidth }) })];
    }
    if (type === 'view_orientation') {
      const svgContent = [
        '<defs>',
        '<linearGradient id="gradient1" x1="0" x2="0" y1="0" y2="1">',
        `<stop stop-color="${fillColor}" offset="60%" />`,
        `<stop stop-color="${ColorHelper.getRgbStyleForColor(fillColor, .25)}" offset="100%" />`,
        '</linearGradient>',
        '</defs>',
        '<path d="m5 4.021 2.366 4.997H2.634L5 4.021Z" fill="url(#gradient1)"/>',
      ].join('');
      const viewDirectionIcon = MapStyleHelper.getSvgIcon({ svgContent,  symbolSize: symbolSize * 3,  rotation,  strokeWidth });
      viewDirectionIcon.setAnchor([ 0.5, 0.175 ]);
      return [
        new Style({ image: MapStyleHelper.getRegularShape({ type: 'circle', fillColor, strokeColor, symbolSize, rotation, strokeWidth }) }),
        new Style({ image: viewDirectionIcon }),
      ];
    }
    return [new Style({ image: MapStyleHelper.getRegularShape({ type, strokeColor, strokeWidth, fillColor, rotation, symbolSize }) })];
  }

  private static createBuffer(buffer: string, config: MapStyleModel) {
    const bufferStyle = new Style({
      geometry: MapStyleHelper.wktParser.readGeometry(buffer),
    });
    const fill = MapStyleHelper.createFill(config, MapStyleHelper.getOpacity(config.fillOpacity, true));
    if (fill) {
      bufferStyle.setFill(fill);
    }
    const stroke = MapStyleHelper.createStroke(config, MapStyleHelper.getOpacity(config.strokeOpacity, true));
    if (stroke) {
      bufferStyle.setStroke(stroke);
    }
    return [bufferStyle];
  }

  private static getOpacity(opacity: number | undefined, hasBuffer?: boolean) {
    return Math.max(0, (opacity || 100) - (hasBuffer ? MapStyleHelper.BUFFER_OPACITY_DECREASE : 0));
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
      // outer,
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
      stroke: MapStyleHelper.getSelectionStroke(),
      zIndex: Infinity,
    });
  }

  private static getSelectionStroke(outer = false) {
    if (outer) {
      return new Stroke({
        color: [ 255, 255, 0, 1 ], width: 3, lineDash: [ 4, 4 ],
      });
    }
    return new Stroke({
      color: [ 255, 0, 0, 1 ], width: 2, lineDash: [ 4, 4 ],
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

  private static createArrowStyles(styleConfig: MapStyleModel, feature?: Feature<Geometry>, strokeStyle?: Stroke | null): Style[] {
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

  private static createFillPattern(color: string, opacity?: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    ctx.strokeStyle = ColorHelper.getRgbStyleForColor(color, opacity);
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 50);
    ctx.moveTo(-50, 0);
    ctx.lineTo(50, 50 * 2);
    ctx.moveTo(0, -50);
    ctx.lineTo(50 * 2, 50);
    ctx.stroke();

    ctx.strokeStyle = ColorHelper.getRgbStyleForColor(color, (opacity || 100) * .75);
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(40, 65);
    ctx.moveTo(10, -15);
    ctx.lineTo(65, 40);
    ctx.stroke();

    const patternCanvas = document.createElement('canvas');
    return patternCanvas.getContext('2d')?.createPattern(canvas, 'repeat');
  }

}
