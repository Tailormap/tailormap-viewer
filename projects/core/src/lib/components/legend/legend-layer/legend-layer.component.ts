import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
export class LegendLayerComponent {
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
