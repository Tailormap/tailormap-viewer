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

  public failedToLoadMessage = $localize `Failed to load legend for`;

  public ngOnChanges() {
    if (this.legendInfo === null) {
      return;
    }
    this.urlWithOptions = this.legendInfo.url;
    this.srcset = '';

    if (this.legendInfo.layer.service?.serverType === ServerType.GEOSERVER
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
