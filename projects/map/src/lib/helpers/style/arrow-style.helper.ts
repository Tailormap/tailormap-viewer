import { MapStyleModel } from '../../models';
import { Feature } from 'ol';
import { Geometry, Point } from 'ol/geom';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';
import { GeometryTypeHelper } from '../geometry-type.helper';
import { forEach as forEachSegments } from 'ol/geom/flat/segments';

export class ArrowStyleHelper {

  public static createArrowStyles(styleConfig: MapStyleModel, feature?: Feature<Geometry>, strokeStyle?: Stroke | null): Style[] {
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
        arrows.push(ArrowStyleHelper.createArrow({
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
        arrows.push(ArrowStyleHelper.createArrow({
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
      arrows.push(ArrowStyleHelper.createArrow({
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
    zIndex?: number;
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
      zIndex: (args.zIndex ?? 0) + 1,
    });
  }

}
