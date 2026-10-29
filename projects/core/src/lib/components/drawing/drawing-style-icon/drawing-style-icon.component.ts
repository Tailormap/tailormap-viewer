import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DrawingHelper, DrawingStyleSvgHelper, DrawingFeatureStyleModel, DrawingFeatureTypeEnum } from '../../../map';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { NgOptimizedImage } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'tm-drawing-style-icon',
  templateUrl: './drawing-style-icon.component.html',
  styleUrls: ['./drawing-style-icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgOptimizedImage,
    MatIcon,
  ],
})
export class DrawingStyleIconComponent {
  private domSanitizer = inject(DomSanitizer);

  public type = input<DrawingFeatureTypeEnum | null>(null);
  public featureStyle = input<DrawingFeatureStyleModel | null>(null);

  public svg = computed(() => {
    const type = this.type();
    const featureStyle = this.featureStyle();
    if (!type || !featureStyle) {
      return '';
    }
    return this.domSanitizer.bypassSecurityTrustHtml(DrawingStyleSvgHelper.getSvg({
      viewBoxWidth: 24,
      viewBoxHeight: 24,
      type,
      styleConfig: featureStyle,
    }));
  });

  public pointSvgIcon = computed(() => {
    const featureStyle = this.featureStyle();
    if (!featureStyle) {
      return '';
    }
    const markers = DrawingHelper.getAvailableMarkers();
    const marker = markers.find(m => m.value === featureStyle?.marker);
    return marker?.icon || '';
  });

  public markerStyle = computed(() => {
    const featureStyle = this.featureStyle();
    if (!featureStyle) {
      return '';
    }
    return [
      `--stroke: ${DrawingStyleSvgHelper.getRgbStyleForColor(featureStyle.markerStrokeColor)}`,
      `--fill: ${DrawingStyleSvgHelper.getRgbStyleForColor(featureStyle.markerFillColor)}`,
    ].join(';');
  });

  public styleMarkerImageUrl = computed(() => {
    return TailormapApiConstants.BASE_URL + this.featureStyle()?.markerImage;
  });

}
