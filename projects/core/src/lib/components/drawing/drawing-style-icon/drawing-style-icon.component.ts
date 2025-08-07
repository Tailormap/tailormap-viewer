import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
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
  private domSanitizer = inject(DomSanitizer);


  @Input()
  public type: DrawingFeatureTypeEnum | null = null;

  @Input()
  public featureStyle: DrawingFeatureStyleModel | null = null;

  public getSvg() {
    if (!this.type || !this.featureStyle) {
      return '';
    }
    const svgContent = DrawingStyleIconComponent.createSvgContent(this.type, this.featureStyle );
    const svgImage = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    return this.domSanitizer.bypassSecurityTrustHtml(svgImage);
  }

  private static createSvgContent(type: DrawingFeatureTypeEnum, styleConfig: DrawingFeatureStyleModel) {
    const style = {
      ...DrawingHelper.getDefaultStyle(),
      ...styleConfig,
    };
    const svgStyle = DrawingStyleIconComponent.getSvgStyle(style);
    const dashArray = DrawingStyleIconComponent.getDashArray(style);
    switch(type) {
      case DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS:
      case DrawingFeatureTypeEnum.CIRCLE:
        return `<circle cx="12" cy="12" r="9" stroke-dasharray="${dashArray}" style="${svgStyle}"></circle>`;
      case DrawingFeatureTypeEnum.ELLIPSE:
        return `<ellipse cx="12" cy="12" rx="9" ry="4" stroke-dasharray="${dashArray}" style="${svgStyle}"></ellipse>`;
      case DrawingFeatureTypeEnum.POLYGON:
        return `<path d="M16.9,2.3l4.8,9.8l-7.1,9.5L3.9,17.4L3,7.7C3,7.7,16.9,2.3,16.9,2.3z"  stroke-dasharray="${dashArray}" style="${svgStyle}""/>`;
      case DrawingFeatureTypeEnum.RECTANGLE:
      case DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE:
      case DrawingFeatureTypeEnum.SQUARE:
        return `<rect x="1" y="1" width="20" height="21" stroke-dasharray="${dashArray}" style="${svgStyle}"></rect>`;
      case DrawingFeatureTypeEnum.LINE:
       return `<line x1="1" y1="12" x2="21" y2="12" stroke-dasharray="${dashArray}" style="${svgStyle}"></line>`;
      case DrawingFeatureTypeEnum.STAR:
         return `<path d="m14.978 8.427 2.078 3.583 4.142.008-2.064 3.591 2.064 3.591-4.142.007-2.078 3.583-2.077-3.583-4.142-.007
            2.064-3.591-2.064-3.591 4.142-.008 2.077-3.583Z" transform="scale(1.6) translate(-8,-8)"
            stroke-dasharray="${dashArray}" style="${DrawingStyleIconComponent.getSvgStyle(style, 1/1.6)}"/></svg>`;
      case DrawingFeatureTypeEnum.LABEL:
       return `<path d="M38.333 25v10H55v40h10V35h16.667V25H38.333zm-20 26.667h10V75h10V51.667h10v-10h-30v10z"
            transform="scale(0.24)" style="${DrawingStyleIconComponent.getLabelSvgStyle(style)}" />`;
    }
    return '';
  }

  private static defaultRgb = 'rgb(30,30,30)';

  private static getRgbStyleForColor(color?: string) {
    return color ? ColorHelper.getRgbStyleForColor(color) : DrawingStyleIconComponent.defaultRgb;
  }

  private static getSvgStyle(style: DrawingFeatureStyleModel, strokeScale = 1) {
    return [
      `stroke-opacity: ${style.strokeOpacity || 100}%`,
      `stroke-width: ${(style.strokeWidth || 3) / 3 * strokeScale}`,
      `stroke: ${DrawingStyleIconComponent.getRgbStyleForColor(style.strokeColor)}`,
      `fill-opacity: ${style.fillOpacity || 100}%`,
      `fill: ${DrawingStyleIconComponent.getRgbStyleForColor(style.fillColor)}`,
      `stroke-linecap: round`,
    ].join(';') + ';';
  }

  private static getLabelSvgStyle(style: DrawingFeatureStyleModel) {
    return [
      `stroke: ${DrawingStyleIconComponent.getRgbStyleForColor(style.labelOutlineColor || 'rgb(255, 255, 255)')}`,
      `stroke-width: 4`,
      `fill: ${DrawingStyleIconComponent.getRgbStyleForColor(style.labelColor)}`,
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
    if (Array.isArray(style.strokeType)) {
      return style.strokeType.join(' ');
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
