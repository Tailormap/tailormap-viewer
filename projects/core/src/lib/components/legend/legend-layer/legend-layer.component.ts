import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { GeoServerLegendOptions, LegendService } from '../services/legend.service';
import { LegendInfoModel } from '../models/legend-info.model';
import { ServerType } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend-layer',
  templateUrl: './legend-layer.component.html',
  styleUrls: ['./legend-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendLayerComponent implements OnChanges {

  @Input()
  public legendInfo: LegendInfoModel | null = null;

  @Input()
  public showTitle = true;

  public urlWithOptions: string | null = null;

  public srcset = '';

  public scaleHiDpiImage = false;

  public failedToLoadMessage = $localize `:@@core.legend.failed-loading-legend:Failed to load legend for`;

  public ngOnChanges() {
    if (this.legendInfo === null) {
      return;
    }
    this.urlWithOptions = this.legendInfo.url;
    this.srcset = '';

    if(this.legendInfo.url.includes('/uploads/legend/') && !this.legendInfo.url.endsWith(".svg")) {
      // Currently, the uploaded image must always be hi-dpi. We don't have two versions (automatically downscaled or separately uploaded)
      // so only hi-dpi. Make sure with CSS transform { scale(0.5) } the image is displayed downscaled on devicePixelRatio = 1 screens as
      // well. Don't downscale SVG images though (checked by extension).
      this.scaleHiDpiImage = true;
    } else if (this.legendInfo.layer.service?.serverType === ServerType.GEOSERVER
      && LegendService.isGetLegendGraphicRequest(this.legendInfo.url)) {
      const legendOptions: GeoServerLegendOptions = {
        fontAntiAliasing: true,
        labelMargin: 0,
        forceLabels: 'on',
      };
      this.urlWithOptions = LegendService.addGeoServerLegendOptions(this.legendInfo.url, legendOptions);
      if (window.devicePixelRatio > 1) {
        legendOptions.dpi = 180;
        this.srcset = LegendService.addGeoServerLegendOptions(this.legendInfo.url, legendOptions) + ' 2x';
      }
    }
  }
}
