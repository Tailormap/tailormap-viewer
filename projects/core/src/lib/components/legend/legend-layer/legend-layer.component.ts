import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { AppLayerWithServiceModel } from '@tailormap-viewer/api';
import { ServerTypeHelper } from '@tailormap-viewer/map';
import { GeoServerLegendOptions, LegendService } from '../services/legend.service';

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

    if (this.url && this.layer && ServerTypeHelper.isGeoServer(this.layer) && LegendService.isGetLegendGraphicRequest(this.url)) {
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
