import {
  ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, viewChild, effect, signal,
} from '@angular/core';
import { LegendInfoModel } from '../models/legend-info.model';
import { LegendHelper, LegendImageModel } from '@tailormap-viewer/shared';
import { ServerType } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend-layer',
  templateUrl: './legend-layer.component.html',
  styleUrls: ['./legend-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LegendLayerComponent implements OnDestroy {
  private container = viewChild('container', { read: ElementRef });
  private resizeObserver: ResizeObserver | null = null;
  public width = signal<number | undefined>(undefined);

  public constructor() {
    effect(() => {
      const containerElement = this.container()?.nativeElement;
      if (containerElement) {
        this.destroyResizeObserver();
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const offsetWidth = entry.target instanceof HTMLElement ? entry.target.offsetWidth : undefined;
            if (offsetWidth && offsetWidth > 0 && offsetWidth !== this.width()) {
              this.width.set(offsetWidth);
            }
          }
        });
        this.resizeObserver.observe(containerElement);
      }
    });
  }

  private destroyResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  public ngOnDestroy(): void {
    this.destroyResizeObserver();
  }

  @Input()
  public legendInfo: LegendInfoModel | null = null;
  @Input()
  public showTitle = true;

  public getLegend(legendInfo: LegendInfoModel): LegendImageModel {
    const selectedStyle = legendInfo.layer.styles?.find(s => s.name === legendInfo.layer.selectedStyleName);
    const url = selectedStyle?.legendUrl ?? legendInfo.url;
    // Can be set to dynamic because it is a hidden proxied URL, or is an actual WMS GetLegendGraphic request
    const dynamicLegend = legendInfo.layer.legendType === 'dynamic' || LegendHelper.isDynamicLegend(url);
    return {
      url,
      serverType: legendInfo.layer.service?.serverType ?? ServerType.GENERIC,
      legendType: dynamicLegend ? 'dynamic' : 'static',
      title: legendInfo.layer.title,
    };
  }
}
