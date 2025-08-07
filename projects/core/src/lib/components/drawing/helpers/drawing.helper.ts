import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import {
  ArrowTypeEnum, DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel, DrawingStyleTypeMap,
  ImageDrawingFeatureStyleModel, LabelDrawingFeatureStyleModel, LabelStyleEnum, LineDrawingFeatureStyleModel,
  MarkerDrawingFeatureStyleModel, MarkerType, PolygonDrawingFeatureStyleModel, StrokeTypeEnum,
} from '../models/drawing-feature.model';
import { DrawingToolEvent, MapStyleModel } from '@tailormap-viewer/map';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { TailormapApiConstants } from '@tailormap-viewer/api';

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

  public static retainStyleAttributesForType<T extends DrawingFeatureTypeEnum>(type: DrawingFeatureTypeEnum, style: DrawingFeatureStyleModel): DrawingStyleTypeMap[T] {
    const labelStyleModel: LabelDrawingFeatureStyleModel = {
      description: style.description,
      label: style.label,
      labelSize: style.labelSize,
      labelColor: style.labelColor,
      labelStyle: style.labelStyle,
      labelRotation: style.labelRotation,
      labelOutlineColor: style.labelOutlineColor,
    };

    const imageStyleModel: ImageDrawingFeatureStyleModel = {
      ...labelStyleModel,
      markerImage: style.markerImage,
      markerImageWidth: style.markerImageWidth,
      markerImageHeight: style.markerImageHeight,
      markerSize: style.markerSize,
      markerRotation: style.markerRotation,
    };

    const markerStyleModel: MarkerDrawingFeatureStyleModel = {
      ...labelStyleModel,
      marker: style.marker,
      markerSize: style.markerSize,
      markerRotation: style.markerRotation,
      markerFillColor: style.markerFillColor,
      markerStrokeColor: style.markerStrokeColor,
      markerStrokeWidth: style.markerStrokeWidth,
    };

    const lineStyleModel: LineDrawingFeatureStyleModel = {
      ...labelStyleModel,
      strokeColor: style.strokeColor,
      strokeOpacity: style.strokeOpacity,
      strokeWidth: style.strokeWidth,
      strokeType: style.strokeType,
      arrowType: style.arrowType,
      dashOffset: style.dashOffset,
      showTotalSize: style.showTotalSize,
      showSegmentSize: style.showSegmentSize,
      secondaryStroke: style.secondaryStroke,
      tertiaryStroke: style.tertiaryStroke,
    };

    const polygonStyleModel: PolygonDrawingFeatureStyleModel = {
      ...lineStyleModel,
      fillOpacity: style.fillOpacity,
      fillColor: style.fillColor,
      stripedFill: style.stripedFill,
    };

    switch (type) {
      case DrawingFeatureTypeEnum.IMAGE: return imageStyleModel;
      case DrawingFeatureTypeEnum.POINT: return markerStyleModel;
      case DrawingFeatureTypeEnum.LINE: return lineStyleModel;
      case DrawingFeatureTypeEnum.LABEL: return labelStyleModel;
      case DrawingFeatureTypeEnum.POLYGON: return polygonStyleModel;
      case DrawingFeatureTypeEnum.SQUARE: return polygonStyleModel;
      case DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH: return polygonStyleModel;
      case DrawingFeatureTypeEnum.RECTANGLE: return polygonStyleModel;
      case DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE: return polygonStyleModel;
      case DrawingFeatureTypeEnum.ELLIPSE: return polygonStyleModel;
      case DrawingFeatureTypeEnum.CIRCLE: return polygonStyleModel;
      case DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS: return polygonStyleModel;
      case DrawingFeatureTypeEnum.STAR: return polygonStyleModel;
    }
  }

  public static getFeature(
    type: DrawingFeatureTypeEnum,
    drawingEvent: DrawingToolEvent,
    style?: DrawingFeatureStyleModel,
    featureAttributes?: Partial<DrawingFeatureModelAttributes>,
  ): DrawingFeatureModel {
    const allStyleAttributes = {
      ...DrawingHelper.getUpdatedDefaultStyle(),
      ...style,
    };
    const styleForType = DrawingHelper.retainStyleAttributesForType(type, allStyleAttributes);
    const attributes: DrawingFeatureModelAttributes = {
      type,
      style: styleForType,
      ...featureAttributes,
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
    return {
      description: '',
      markerImage: undefined,
      markerImageWidth: 32,
      markerImageHeight: 32,
      markerRotation: 0,
      markerSize: 10,
      marker: 'circle',
      markerFillColor: ApplicationStyleService.getPrimaryColor(),
      markerStrokeColor: ApplicationStyleService.getPrimaryColor(),
      markerStrokeWidth: 1,
      secondaryStroke: undefined,
      tertiaryStroke: undefined,
      fillOpacity: 30,
      fillColor: ApplicationStyleService.getPrimaryColor(),
      stripedFill: false,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeOpacity: 100,
      strokeWidth: 3,
      strokeType: StrokeTypeEnum.SOLID,
      dashOffset: 0,
      arrowType: ArrowTypeEnum.NONE,
      strokeOffset: 0,
      label: '',
      labelSize: 12,
      labelColor: 'rgb(0, 0, 0)',
      labelStyle: [],
      labelRotation: 0,
      labelOutlineColor: 'white',
    };
  }

  public static getUpdatedDefaultStyle(): DrawingFeatureStyleModel {
    return {
      ...DrawingHelper.getDefaultStyle(),
      ...DrawingHelper.updatedDefaultStyle,
    };
  }

  public static applyDrawingStyle(feature: DrawingFeatureModel): MapStyleModel {
    const style = feature.attributes.style;
    return {
      styleKey: 'drawing-style',
      zIndex: feature.attributes.zIndex || 0,
      pointImage: style.markerImage ? TailormapApiConstants.BASE_URL + style.markerImage : undefined,
      pointImageWidth: style.markerImageWidth,
      pointImageHeight: style.markerImageHeight,
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
      dashOffset: style.dashOffset,
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
      secondaryStroke: style.secondaryStroke,
      tertiaryStroke: style.tertiaryStroke,
    };
  }

}
