import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import {
  ArrowTypeEnum, DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel, LabelStyleEnum, MarkerType, StrokeTypeEnum,
} from '../models/drawing-feature.model';
import { DrawingToolEvent, MapStyleModel } from '@tailormap-viewer/map';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationStyleService } from '../../../services/application-style.service';

export class DrawingHelper {

  private static updatedDefaultStyle: Partial<DrawingFeatureStyleModel> = {};

  public static getAvailableMarkers(): Array<{ value: MarkerType; icon: string }> {
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
    { value: ArrowTypeEnum.NONE, label: $localize `:@@core.drawing.arrow-none:None` },
    { value: ArrowTypeEnum.START, label: $localize `:@@core.drawing.arrow-at-the-start:At the start` },
    { value: ArrowTypeEnum.END, label: $localize `:@@core.drawing.arrow-at-the-end:At the end` },
    { value: ArrowTypeEnum.BOTH, label: $localize `:@@core.drawing.arrow-on-both-sides:On both sides` },
    { value: ArrowTypeEnum.ALONG, label: $localize `:@@core.drawing.arrow-on-every-segment:On every segment` },
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
    return {
      __fid: uuidv4(),
      geometry: drawingEvent.geometry,
      attributes,
    };
  }

  public static getDuplicateFeature(feature: DrawingFeatureModel): DrawingFeatureModel {
    return {
      __fid: uuidv4(),
      geometry: feature.geometry,
      attributes: {
        ...feature.attributes,
      },
    };
  }

  public static updateDefaultStyle(style: Partial<DrawingFeatureStyleModel>) {
    DrawingHelper.updatedDefaultStyle = {
      ...DrawingHelper.updatedDefaultStyle,
      ...style,
    };
  }

  public static getDefaultStyle(): DrawingFeatureStyleModel {
    const defaultStyle: DrawingFeatureStyleModel = {
      marker: 'circle',
      markerFillColor: ApplicationStyleService.getPrimaryColor(),
      markerStrokeColor: ApplicationStyleService.getPrimaryColor(),
      markerSize: 5,
      markerStrokeWidth: 1,
      markerRotation: 0,
      fillOpacity: 30,
      fillColor: ApplicationStyleService.getPrimaryColor(),
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeOpacity: 100,
      strokeWidth: 3,
      label: '',
      labelSize: 12,
      labelColor: 'rgb(0, 0, 0)',
    };
    return { ...defaultStyle, ...DrawingHelper.updatedDefaultStyle };
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
      showSegmentSize: style.showSegmentSize,
      showTotalSize: style.showTotalSize,
    };
  }

}
