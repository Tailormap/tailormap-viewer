import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ColorHelper } from '@tailormap-viewer/shared';
import { DrawingFeatureStyleModel, StrokeTypeEnum } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models';
import { DrawingHelper } from '../helpers/drawing.helper';
import { TailormapApiConstants } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-drawing-style-icon',
  templateUrl: './drawing-style-icon.component.html',
  styleUrls: ['./drawing-style-icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingStyleIconComponent {

  @Input()
  public type: DrawingFeatureTypeEnum | null = null;

  @Input()
  public featureStyle: DrawingFeatureStyleModel | null = null;

  constructor(
    private domSanitizer: DomSanitizer,
  ) { }

  public getSvg() {
    if (!this.type || !this.featureStyle) {
      return '';
    }
    const svgContent = DrawingStyleIconComponent.createSvgContent(this.type, this.featureStyle );
    const svgImage = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    return this.domSanitizer.bypassSecurityTrustHtml(svgImage);
  }

  private static createSvgContent(type: DrawingFeatureTypeEnum, style: DrawingFeatureStyleModel) {
    const svgStyle = DrawingStyleIconComponent.getSvgStyle(style);
    const dashArray = DrawingStyleIconComponent.getDashArray(style);
    switch(type) {
      case DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS:
      case DrawingFeatureTypeEnum.CIRCLE:
      case DrawingFeatureTypeEnum.ELLIPSE:
        return `<circle cx="50" cy="50" r="35" stroke-dasharray="${dashArray}" style="${svgStyle}"></circle>`;
      case DrawingFeatureTypeEnum.POLYGON:
      case DrawingFeatureTypeEnum.RECTANGLE:
      case DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE:
      case DrawingFeatureTypeEnum.SQUARE:
        return `<rect x="20" y="20" width="60" height="60" rx="5" stroke-dasharray="${dashArray}" style="${svgStyle}"></rect>`;
      case DrawingFeatureTypeEnum.LINE:
       return `<line x1="10" y1="50" x2="90" y2="50" stroke-dasharray="${dashArray}" style="${svgStyle}"></line>`;
      case DrawingFeatureTypeEnum.LABEL:
       return `<path d="M38.333 25v10H55v40h10V35h16.667V25H38.333zm-20 26.667h10V75h10V51.667h10v-10h-30v10z" style="${svgStyle}" />`;
    }
    return '';
  }

  private static defaultRgb = 'rgb(30,30,30)';

  private static getRgbStyleForColor(color?: string) {
    return color ? ColorHelper.getRgbStyleForColor(color) : DrawingStyleIconComponent.defaultRgb;
  }

  private static getSvgStyle(style: DrawingFeatureStyleModel) {
    return [
      `stroke-opacity: ${style.strokeOpacity}`,
      `stroke-width: ${style.strokeWidth}`,
      `stroke: ${DrawingStyleIconComponent.getRgbStyleForColor(style.strokeColor)}`,
      `fill-opacity: ${style.fillOpacity}`,
      `fill: ${DrawingStyleIconComponent.getRgbStyleForColor(style.fillColor)}`,
      `stroke-linecap: round`,
    ].join(';') + ';';
  }

  public static getDashArray(style: DrawingFeatureStyleModel) {
    if (style.strokeType === StrokeTypeEnum.SOLID || !style.strokeWidth) {
      return '0';
    }
    if (style.strokeType === StrokeTypeEnum.DASH) {
      return [ Math.max(0, style.strokeWidth) + 4, Math.max(6, style.strokeWidth) + 6 ].join(' ');
    }
    if (style.strokeType === StrokeTypeEnum.DOT) {
      return [ 1, Math.max(4, style.strokeWidth) + 4 ].join(' ');
    }
    return '0';
  }

  public getPointSvgIcon() {
    const markers = DrawingHelper.getAvailableMarkers();
    const marker = markers.find(m => m.value === this.featureStyle?.marker);
    return marker?.icon || '';
  }

  public getMarkerStyle() {
    return !this.featureStyle ? '' : [
      `--stroke: ${DrawingStyleIconComponent.getRgbStyleForColor(this.featureStyle.markerStrokeColor)}`,
      `--fill: ${DrawingStyleIconComponent.getRgbStyleForColor(this.featureStyle.markerFillColor)}`,
    ].join(';');
  }

  public getStyleMarkerImageUrl() {
    return TailormapApiConstants.BASE_URL + this.featureStyle?.markerImage;
  }
}
