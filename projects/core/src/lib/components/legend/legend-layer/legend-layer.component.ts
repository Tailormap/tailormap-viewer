import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ResolvedServerType } from '@tailormap-viewer/api';
import { GeoServerLegendOptions, LegendService } from '../services/legend.service';
import { AppLayerWithServiceModel } from '../../../map/models';

@Component({
  selector: 'tm-legend-layer',
  templateUrl: './legend-layer.component.html',
  styleUrls: ['./legend-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendLayerComponent implements OnChanges {

  @Input()
  public layer: AppLayerWithServiceModel | null = null;

  @Input()
  public url: string | null = null;

  public urlWithOptions: string | null = null;

  public srcset = '';

  public failedToLoadMessage = $localize `Failed to load legend for`;

  public ngOnChanges() {
    this.urlWithOptions = this.url;
    this.srcset = '';

    if (this.url && this.layer?.service?.resolvedServerType === ResolvedServerType.GEOSERVER
      && LegendService.isGetLegendGraphicRequest(this.url)) {
      const legendOptions: GeoServerLegendOptions = {
        fontAntiAliasing: true,
        labelMargin: 0,
      };
      this.urlWithOptions = LegendService.addGeoServerLegendOptions(this.url, legendOptions);
      if (window.devicePixelRatio > 1) {
        legendOptions.dpi = 180;
        this.srcset = LegendService.addGeoServerLegendOptions(this.url, legendOptions) + ' 2x';
      }
    }
  }
}
