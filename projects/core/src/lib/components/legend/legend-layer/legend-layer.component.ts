import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { AppLayerWithServiceModel } from '@tailormap-viewer/api';
import { ServerTypeHelper } from '@tailormap-viewer/map';

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

    if (this.url) {
      try {
        const url = new URL(this.url);
        if (this.layer && this.layer.service
          && (this.layer.service.hiDpiMode === 'geoserver' || (this.layer.service.hiDpiMode === 'auto' && ServerTypeHelper.getFromUrl(this.layer.service.url) === 'geoserver')
          && url.searchParams.get('REQUEST') === 'GetLegendGraphic')) {

          const legendOptions: any = {
            fontAntiAliasing: 'true',
            labelMargin: '0',
          };

          const updateUrlLegendOptions = () => url.searchParams.set('LEGEND_OPTIONS', Object.entries(legendOptions).map(entry => entry.join(':')).join(';'));
          updateUrlLegendOptions();
          this.urlWithOptions = url.toString();

          if (window.devicePixelRatio > 1) {
            legendOptions.dpi = 180;
            updateUrlLegendOptions();
            this.srcset = url.toString() + ' 2x';
          }
        }
      } catch(_ignored) {
      }
    }
  }
}
