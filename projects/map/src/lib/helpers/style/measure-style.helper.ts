import { Feature } from 'ol';
import { MapSizeHelper } from '../map-size.helper';
import { Polygon, LineString, Point, Circle, Geometry, MultiLineString, MultiPolygon } from 'ol/geom.js';
import { Fill, RegularShape, Stroke, Style, Text } from 'ol/style.js';
import { LabelStyleHelper } from './label-style.helper';

export class MeasureStyleHelper {

  private static labelFont = `13px ${LabelStyleHelper.DEFAULT_FONT_FAMILY}`;
  private static labelStyle = MeasureStyleHelper.getLabelStyle('label');
  private static segmentStyle = MeasureStyleHelper.getLabelStyle('segment');

  public static addMeasures(
    feature: Feature,
    showTotalSize?: boolean,
    showSegmentSize?: boolean,
    projection?: string,
  ) {
    const styles = [];
    const geometry = feature.getGeometry();
    if (!geometry) {
      return [];
    }
    if (showSegmentSize) {
      MeasureStyleHelper.getMeasurableLines(geometry).forEach(line => {
        line.forEachSegment(function (a, b) {
          const segment = new LineString([ a, b ]);
          const label = MapSizeHelper.getFormattedSize(segment, projection);
          const segmentStyle = MeasureStyleHelper.segmentStyle.clone();
          segmentStyle.setGeometry(segment);
          segmentStyle.getText()?.setText(label);
          styles.push(segmentStyle);
        });
      });
    }
    if (showTotalSize) {
      let point: Point | undefined;
      if (geometry instanceof Polygon) {
        point = geometry.getInteriorPoint();
      } else if (geometry instanceof MultiPolygon) {
        point = MeasureStyleHelper.getLargestPolygon(geometry)?.getInteriorPoint();
      } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
        point = new Point(geometry.getLastCoordinate());
      } else if (geometry instanceof Circle) {
        point = new Point(geometry.getCenter());
      }
      const sizeLabel = MapSizeHelper.getFormattedSize(geometry, projection);
      if (point && sizeLabel) {
        const labelStyle = MeasureStyleHelper.labelStyle.clone();
        labelStyle.setGeometry(point);
        labelStyle.getText()?.setText(sizeLabel);
        labelStyle.setZIndex(99999999);
        styles.push(labelStyle);
      }
    }
    return styles;
  }

  /**
   * Returns the lines to show segment sizes for: the exterior ring(s) of (multi)polygons and the line(s) of (multi)linestrings.
   */
  private static getMeasurableLines(geometry: Geometry): LineString[] {
    if (geometry instanceof Polygon) {
      return [new LineString(geometry.getCoordinates()[0])];
    }
    if (geometry instanceof MultiPolygon) {
      return geometry.getPolygons().map(polygon => new LineString(polygon.getCoordinates()[0]));
    }
    if (geometry instanceof LineString) {
      return [geometry];
    }
    if (geometry instanceof MultiLineString) {
      return geometry.getLineStrings();
    }
    return [];
  }

  private static getLargestPolygon(geometry: MultiPolygon): Polygon | undefined {
    return geometry.getPolygons()
      .reduce<Polygon | undefined>((largest, polygon) => (!largest || polygon.getArea() > largest.getArea()) ? polygon : largest, undefined);
  }

  private static getLabelStyle(type: 'label' | 'segment') {
    const fillColor = type === 'segment' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    return new Style({
      text: new Text({
        placement: type === 'segment' ? 'line' : undefined,
        font: MeasureStyleHelper.labelFont,
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: fillColor,
        }),
        stroke: type === 'segment' ? new Stroke({ color: 'rgba(0, 0, 0, 1)', width: 4 }) : undefined,
        padding: type === 'segment' ? [ 2, 2, 2, 2 ] : [ 3, 3, 3, 3 ],
        textBaseline: 'bottom',
        offsetY: type === 'segment' ? -5 : -12,
      }),
      image: type === 'segment' ? undefined : new RegularShape({
        radius: 6,
        points: 3,
        angle: Math.PI,
        displacement: [ 0, 6 ],
        fill: new Fill({
          color: fillColor,
        }),
      }),
    });
  }

}
