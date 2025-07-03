import { Feature } from 'ol';
import { MapSizeHelper } from '../map-size.helper';
import { Polygon, LineString, Point, Circle } from 'ol/geom';
import { Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import { LabelStyleHelper } from './label-style.helper';

export class MeasureStyleHelper {

  private static labelFont = `13px ${LabelStyleHelper.DEFAULT_FONT_FAMILY}`;
  private static labelStyle = MeasureStyleHelper.getLabelStyle('label');
  private static segmentStyle = MeasureStyleHelper.getLabelStyle('segment');

  public static addMeasures(
    feature: Feature,
    showTotalSize?: boolean,
    showSegmentSize?: boolean,
  ) {
    const styles: Style[] = [];
    const geometry = feature.getGeometry();
    if (!geometry) {
      return [];
    }
    if (showSegmentSize) {
      let line: LineString | undefined;
      if (geometry instanceof Polygon) {
        line = new LineString(geometry.getCoordinates()[0]);
      } else if (geometry instanceof LineString) {
        line = geometry;
      }
      line?.forEachSegment(function (a, b) {
        const segment = new LineString([ a, b ]);
        const label = MapSizeHelper.getFormattedSize(segment);
        const segmentStyle = MeasureStyleHelper.segmentStyle.clone();
        segmentStyle.setGeometry(segment);
        segmentStyle.getText()?.setText(label);
        styles.push(segmentStyle);
      });
    }
    if (showTotalSize) {
      let point: Point | undefined;
      if (geometry instanceof Polygon) {
        point = geometry.getInteriorPoint();
      } else if (geometry instanceof LineString) {
        point = new Point(geometry.getLastCoordinate());
      } else if (geometry instanceof Circle) {
        point = new Point(geometry.getCenter());
      }
      const sizeLabel = MapSizeHelper.getFormattedSize(geometry);
      if (point && sizeLabel) {
        const labelStyle = MeasureStyleHelper.labelStyle.clone();
        labelStyle.setGeometry(point);
        labelStyle.getText()?.setText(sizeLabel);
        styles.push(labelStyle);
      }
    }
    return styles;
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
