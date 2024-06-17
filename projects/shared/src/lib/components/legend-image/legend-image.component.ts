import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GeoServerLegendOptions, LegendHelper } from './legend.helper';

export interface LegendImageModel {
  url: string;
  serverType: 'generic' | 'geoserver' | 'mapserver';
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
})
export class LegendImageComponent {

  @Input({ required: true })
  public set legend(legend: LegendImageModel | null) {
    this.createSettings(legend);
  }

  public legendSettings: LegendImageSettingsModel | null = null;

  public constructor(
    private cdr: ChangeDetectorRef,
  ) {
  }

  public createSettings(legend: LegendImageModel | null) {
    // Always set legend settings to null first and detect changes
    // This forces the <img> tag to re-render in case of changing input
    // Sometimes the zoom for hi-dpi images would otherwise not be applied correctly
    // resulting in too large or too small images
    this.legendSettings = null;
    this.cdr.detectChanges();
    if (legend === null) {
      return;
    }
    const legendSettings: LegendImageSettingsModel = {
      url: legend.url,
      srcset: '',
      scaleHiDpiImage: legend.url.includes('/uploads/legend/') && !legend.url.endsWith(".svg"),
      failedToLoadMessage: `${FAILED_TO_LOAD_MESSAGE} ${legend.title}`,
    };
    if (LegendHelper.isGetLegendGraphicRequest(legend.url)) {
      if (legend.serverType === 'geoserver') {
        const legendOptions: GeoServerLegendOptions = {
          fontAntiAliasing: true,
          labelMargin: 0,
          forceLabels: 'on',
        };
        legendSettings.url = LegendHelper.addGeoServerLegendOptions(legend.url, legendOptions);
        if (window.devicePixelRatio > 1) {
          legendOptions.dpi = 180;
          legendSettings.srcset = LegendHelper.addGeoServerLegendOptions(legend.url, legendOptions) + ' 2x';
        }
      } else if (legend.serverType === 'mapserver') {
        const u = new URL(legend.url);
        u.searchParams.set('MAP_RESOLUTION', '144');
        legendSettings.srcset = u.toString() + ' 2x';
      }
    }
    this.legendSettings = legendSettings;
    this.cdr.detectChanges();
  }

}
