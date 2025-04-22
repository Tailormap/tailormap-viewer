import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ColorHelper } from '@tailormap-viewer/shared';
import { DrawingFeatureModel, DrawingFeatureStyleModel, StrokeTypeEnum } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models';

@Component({
  selector: 'tm-drawing-feature-image',
  templateUrl: './drawing-feature-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingFeatureImageComponent {

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
    const svgParts: string[] = [];
    const type = feature.attributes.type;
    if (type === DrawingFeatureTypeEnum.CIRCLE || type === DrawingFeatureTypeEnum.ELLIPSE) {
      svgParts.push(`<circle cx="50" cy="50" r="35" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></circle>`);
    }
    if (type === DrawingFeatureTypeEnum.POLYGON || type === DrawingFeatureTypeEnum.RECTANGLE || type === DrawingFeatureTypeEnum.SQUARE) {
      svgParts.push(`<rect x="20" y="20" width="60" height="60" rx="5" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></rect>`);
    }
    if (type === DrawingFeatureTypeEnum.LINE) {
      svgParts.push(`<line x1="10" y1="50" x2="90" y2="50" stroke-dasharray="${this.getDashArray(style)}" style="${this.getStyle(style)}"></line>`);
    }
    if (type === DrawingFeatureTypeEnum.POINT) {
      svgParts.push(`<circle cx="50" cy="50" r="10" style="${this.getStyle(style)}"></circle>`);
    }
    if (type === DrawingFeatureTypeEnum.LABEL) {
      svgParts.push(`<path d="M38.333 25v10H55v40h10V35h16.667V25H38.333zm-20 26.667h10V75h10V51.667h10v-10h-30v10z" style="${this.getStyle(style)}" />`);
    }

    return svgParts.join('');
  }

  private defaultRgb = 'rgb(30,30,30)';

  private getStyle(style: DrawingFeatureStyleModel) {
    return [
      `stroke-opacity: ${style.strokeOpacity}`,
      `stroke-width: ${style.strokeWidth}`,
      `stroke: ${style.strokeColor ? ColorHelper.getRgbStyleForColor(style.strokeColor) : this.defaultRgb}`,
      `fill-opacity: ${style.fillOpacity}`,
      `fill: ${style.fillColor ? ColorHelper.getRgbStyleForColor(style.fillColor) : this.defaultRgb}`,
      `stroke-linecap: round`,
    ].join(';') + ';';
  }

  public  getDashArray(style: DrawingFeatureStyleModel) {
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
}
