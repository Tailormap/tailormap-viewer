import { ChangeDetectionStrategy, Component, effect, Input, input, signal } from '@angular/core';
import { GeoServerLegendOptions, LegendHelper } from './legend.helper';

export interface LegendImageModel {
  url: string;
  serverType: 'generic' | 'geoserver' | 'mapserver';
  legendType: 'static' | 'dynamic';
  title: string;
}

interface LegendImageSettingsModel {
  url: string;
  scaleHiDpiImage: boolean;
  failedToLoadMessage: string;
  srcset: string;
}

const FAILED_TO_LOAD_MESSAGE = $localize `:@@shared.legend-image.failed-loading-legend:Failed to load legend for`;

@Component({
  selector: 'tm-legend-image',
  templateUrl: './legend-image.component.html',
  styleUrls: ['./legend-image.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LegendImageComponent {

  public loading = signal(false);
  private prevLegend: LegendImageModel | null = null;

  @Input({ required: true })
  public set legend(legend: LegendImageModel | null) {
    if (
      !this.prevLegend ||
      !legend
      || this.prevLegend.url !== legend.url
      || this.prevLegend.title !== legend.title
      || this.prevLegend.serverType !== legend.serverType
    ) {
      this.createSettings(legend);
      this.prevLegend = legend;
    }
  }

  public width = input<number | undefined>();

  public legendSettings = signal<LegendImageSettingsModel | null>(null);

  constructor() {
    effect(() => {
      // Track width changes
      this.width();
      // Recreate settings when width changes
      if (this.prevLegend) {
        this.createSettings(this.prevLegend);
      }
    });
  }

  public createSettings(legend: LegendImageModel | null) {
    // Always set legend settings to null first and detect changes
    // This forces the <img> tag to re-render in case of changing input
    // Sometimes the zoom for hi-dpi images would otherwise not be applied correctly
    // resulting in too large or too small images
    this.legendSettings.set(null);
    if (legend === null) {
      return;
    }
    const legendSettings: LegendImageSettingsModel = {
      url: legend.url,
      srcset: '',
      scaleHiDpiImage: legend.url.includes('/uploads/legend/') && !legend.url.endsWith('.svg'),
      failedToLoadMessage: `${FAILED_TO_LOAD_MESSAGE} ${legend.title}`,
    };
    if (legend.legendType == 'dynamic') {
      if (legend.serverType === 'geoserver') {
        const wrapOptions = this.width() ? { wrap: true, wrap_limit: Math.floor(this.width()! * 1.5) } : {};
        const legendOptions: GeoServerLegendOptions = {
          fontAntiAliasing: true,
          labelMargin: 0,
          forceLabels: 'on',
          ...wrapOptions,
        };
        legendSettings.url = LegendHelper.addGeoServerLegendOptions(legend.url, legendOptions);
        if (window.devicePixelRatio > 1) {
          const wrapOptions2x = this.width() ? { wrap: true, wrap_limit: Math.floor(this.width()! * 3.8) } : {};
          legendOptions.dpi = 180;
          legendSettings.srcset = LegendHelper.addGeoServerLegendOptions(legend.url, {
            ...legendOptions,
            ...wrapOptions2x,
          }) + ' 2x';
        }
      } else if (legend.serverType === 'mapserver') {
        const u = new URL(legend.url);
        u.searchParams.set('MAP_RESOLUTION', '144');
        legendSettings.srcset = u.toString() + ' 2x';
      }
    }
    this.legendSettings.set(legendSettings);
  }

}
