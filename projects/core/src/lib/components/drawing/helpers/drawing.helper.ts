import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import {
  ArrowTypeEnum, DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel, LabelStyleEnum, MakerType, StrokeTypeEnum,
} from '../models/drawing-feature.model';
import { DrawingToolEvent, MapStyleModel } from '@tailormap-viewer/map';
import { nanoid } from 'nanoid';
import { $localize } from '@angular/localize/init';

export class DrawingHelper {

  private static defaultStyle: DrawingFeatureStyleModel = {
    marker: 'circle',
    markerFillColor: '#6236ff',
    markerStrokeColor: '#6236ff',
    markerSize: 5,
    markerStrokeWidth: 1,
    markerRotation: 0,
    fillOpacity: 30,
    fillColor: '#6236ff',
    strokeColor: '#6236ff',
    strokeOpacity: 100,
    strokeWidth: 3,
    label: '',
    labelSize: 12,
    labelColor: '#000000',
  };

  private static updatedDefaultStyle: Partial<DrawingFeatureStyleModel> = {};

  public static getAvailableMarkers(): Array<{ value: MakerType; icon: string }> {
    return [
      { value: 'circle', icon: 'markers_circle' },
      { value: 'square', icon: 'markers_square' },
      { value: 'diamond', icon: 'markers_diamond' },
      { value: 'triangle', icon: 'markers_triangle' },
      { value: 'arrow', icon: 'markers_arrow' },
      { value: 'cross', icon: 'markers_cross' },
      { value: 'star', icon: 'markers_star' },
    ];
  }

  public static arrowTypeValues = [
    { value: ArrowTypeEnum.NONE, label: $localize `None` },
    { value: ArrowTypeEnum.START, label: $localize `At the start` },
    { value: ArrowTypeEnum.END, label: $localize `At the end` },
    { value: ArrowTypeEnum.BOTH, label: $localize `On both sides` },
    { value: ArrowTypeEnum.ALONG, label: $localize `On every segment` },
  ];

  public static strokeTypeValues = [
    StrokeTypeEnum.SOLID,
    StrokeTypeEnum.DASH,
    StrokeTypeEnum.DOT,
  ];

  public static getFeature(type: DrawingFeatureTypeEnum, drawingEvent: DrawingToolEvent): DrawingFeatureModel {
    const attributes: DrawingFeatureModelAttributes = {
      type,
      style: DrawingHelper.getDefaultStyle(),
    };
    if (type ===  DrawingFeatureTypeEnum.CIRCLE) {
      attributes.isCircle = true;
      attributes.radius = drawingEvent.radius;
      attributes.center = drawingEvent.centerCoordinate;
    }
    return {
      __fid: nanoid(),
      geometry: drawingEvent.geometry,
      attributes,
    };
  }

  public static updateDefaultStyle(style: Partial<DrawingFeatureStyleModel>) {
    DrawingHelper.updatedDefaultStyle = {
      ...DrawingHelper.updatedDefaultStyle,
      ...style,
    };
  }

  public static getDefaultStyle(): DrawingFeatureStyleModel {
    return { ...DrawingHelper.defaultStyle, ...DrawingHelper.updatedDefaultStyle };
  }

  public static applyDrawingStyle(feature: DrawingFeatureModel): MapStyleModel {
    const style = feature.attributes.style;
    return {
      styleKey: 'drawing-style',
      zIndex: feature.attributes.zIndex || 0,
      pointType: feature.attributes.type === DrawingFeatureTypeEnum.LABEL
        ? 'label'
        : (feature.attributes.type === DrawingFeatureTypeEnum.POINT ? style.marker : undefined),
      pointSize: style.markerSize,
      pointFillColor: feature.attributes.type === DrawingFeatureTypeEnum.POINT
        ? style.markerFillColor
        : 'transparent',
      pointStrokeColor: feature.attributes.type === DrawingFeatureTypeEnum.POINT
        ? style.markerStrokeColor
        : 'transparent',
      pointStrokeWidth: style.markerStrokeWidth,
      pointRotation: style.markerRotation,
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
      strokeOpacity: style.strokeOpacity,
      strokeType: style.strokeType,
      arrowType: style.arrowType,
      fillColor: style.fillColor,
      fillOpacity: style.fillOpacity,
      stripedFill: style.stripedFill,
      isSelected: feature.attributes.selected,
      label: style.label,
      labelSize: style.labelSize,
      labelColor: style.labelColor,
      labelStyle: (style.labelStyle || []).map<'bold'|'italic'>(labelStyle => {
        return labelStyle === LabelStyleEnum.ITALIC
          ? 'italic'
          : 'bold';
      }),
      labelRotation: style.labelRotation,
      labelOutlineColor: style.labelOutlineColor,
    };
  }

}
