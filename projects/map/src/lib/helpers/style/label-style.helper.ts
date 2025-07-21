import { MapStyleModel } from '../../models';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { UnitsHelper } from './units.helper';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { GeometryTypeHelper } from '../geometry-type.helper';
import { SelectionStyleHelper } from './selection-style.helper';
import { MapSizeHelper } from '../map-size.helper';

export class LabelStyleHelper {

  public static DEFAULT_FONT_FAMILY = 'Inter, "Lucida Sans Unicode", "Lucida Grande", sans-serif';
  private static DEFAULT_FONT_SIZE = 12;
  private static DEFAULT_LABEL_COLOR = '#000000';

  public static createLabelStyle(
    styleConfig: MapStyleModel,
    symbolSize: number,
    defaultSymbolSize: number,
    feature?: Feature<Geometry>,
    zIndex?: number,
  ) {
    const geom = feature?.getGeometry();
    const label = LabelStyleHelper.replaceSpecialValues(styleConfig.label, geom);
    const labelSize = UnitsHelper.getNumberValue(styleConfig.labelSize, defaultSymbolSize);
    const scale = 1 + (labelSize / LabelStyleHelper.DEFAULT_FONT_SIZE);
    const offsetY = styleConfig.pointType === 'label'
      ? 0
      : 14 + (symbolSize - defaultSymbolSize) + (scale * 2);

    const italic = (styleConfig.labelStyle || []).includes('italic');
    const bold = (styleConfig.labelStyle || []).includes('bold');
    const font = [
      italic ? 'italic' : undefined,
      bold ? 'bold' : undefined,
      '8px',
      LabelStyleHelper.DEFAULT_FONT_FAMILY,
    ].filter(Boolean).join(' ');

    const showSelectionRectangle = styleConfig.isSelected && !!styleConfig.pointType;
    const DEFAULT_SELECTION_PADDING = 10;
    const paddingTop: number = styleConfig.pointType === 'label'
      ? DEFAULT_SELECTION_PADDING
      : (styleConfig.pointType ? offsetY + symbolSize + DEFAULT_SELECTION_PADDING : 0);

    const baseLabelStyle = new Style({
      zIndex,
      text: new Text({
        placement: GeometryTypeHelper.isLineGeometry(geom) ? 'line' : undefined,
        text: label,
        font,
        fill: new Fill({
          color: styleConfig.labelColor || LabelStyleHelper.DEFAULT_LABEL_COLOR,
        }),
        rotation: UnitsHelper.getRotationForDegrees(styleConfig.labelRotation),
        stroke: styleConfig.labelOutlineColor
          ? new Stroke({ color: styleConfig.labelOutlineColor, width: 2 })
          : undefined,
        offsetY,
        scale,
        backgroundStroke: showSelectionRectangle ? SelectionStyleHelper.getSelectionStroke() : undefined,
        padding: showSelectionRectangle
          ? [ paddingTop, DEFAULT_SELECTION_PADDING, DEFAULT_SELECTION_PADDING, DEFAULT_SELECTION_PADDING ]
          : undefined,
      }),
    });
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

}
