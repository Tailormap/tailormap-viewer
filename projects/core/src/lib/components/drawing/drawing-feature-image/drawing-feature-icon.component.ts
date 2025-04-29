import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ColorHelper } from '@tailormap-viewer/shared';
import {
  DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel, StrokeTypeEnum,
} from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models';
import { DrawingHelper } from '../helpers/drawing.helper';

@Component({
  selector: 'tm-drawing-feature-icon',
  templateUrl: './drawing-feature-icon.component.html',
  styleUrls: ['./drawing-feature-icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingFeatureIconComponent {

  @Input()
  public feature: DrawingFeatureModel | null = null;

  constructor(
    private domSanitizer: DomSanitizer,
  ) { }

  public getSvg() {
    if (!this.feature) {
      return '';
    }
    const svgContent = this.createSvgContent(this.feature);
    const svgImage = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    return this.domSanitizer.bypassSecurityTrustHtml(svgImage);
  }

  private createSvgContent(feature: DrawingFeatureModel) {
    const style = feature.attributes.style;
    switch(feature.attributes.type) {
      case DrawingFeatureTypeEnum.CIRCLE:
      case DrawingFeatureTypeEnum.ELLIPSE:
        return `<circle cx="50" cy="50" r="35" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></circle>`;
      case DrawingFeatureTypeEnum.POLYGON:
      case DrawingFeatureTypeEnum.RECTANGLE:
      case DrawingFeatureTypeEnum.SQUARE:
        return `<rect x="20" y="20" width="60" height="60" rx="5" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></rect>`;
      case DrawingFeatureTypeEnum.LINE:
       return `<line x1="10" y1="50" x2="90" y2="50" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></line>`;
      case DrawingFeatureTypeEnum.LABEL:
       return `<path d="M38.333 25v10H55v40h10V35h16.667V25H38.333zm-20 26.667h10V75h10V51.667h10v-10h-30v10z" style="${this.getStyle(style)}" />`;
    }
    return '';
  }

  private defaultRgb = 'rgb(30,30,30)';

  private getRgbStyleForColor(color?: string) {
    return color ? ColorHelper.getRgbStyleForColor(color) : this.defaultRgb;
  }

  private getStyle(style: DrawingFeatureStyleModel) {
    return [
      `stroke-opacity: ${style.strokeOpacity}`,
      `stroke-width: ${style.strokeWidth}`,
      `stroke: ${this.getRgbStyleForColor(style.strokeColor)}`,
      `fill-opacity: ${style.fillOpacity}`,
      `fill: ${this.getRgbStyleForColor(style.fillColor)}`,
      `stroke-linecap: round`,
    ].join(';') + ';';
  }

  public getDashArray(style: DrawingFeatureStyleModel) {
    if (style.strokeType === StrokeTypeEnum.SOLID || !style.strokeWidth) {
      return '0';
    }
    if (style.strokeType === StrokeTypeEnum.DASH) {
      return [ Math.max(0, style.strokeWidth) + 4, Math.max(6, style.strokeWidth) + 6 ];
    }
    if (style.strokeType === StrokeTypeEnum.DOT) {
      return [ 1, Math.max(4, style.strokeWidth) + 4 ];
    }
    return '0';
  }

  public getPointSvgIcon(attributes: DrawingFeatureModelAttributes) {
    const markers = DrawingHelper.getAvailableMarkers();
    const marker = markers.find(m => m.value === attributes.style.marker);
    return marker?.icon || '';
  }

  public getMarkerStyle(attributes: DrawingFeatureModelAttributes) {
    return [
      `--stroke: ${this.getRgbStyleForColor(attributes.style.markerStrokeColor)}`,
      `--fill: ${this.getRgbStyleForColor(attributes.style.markerFillColor)}`,
    ].join(';');
  }
}
