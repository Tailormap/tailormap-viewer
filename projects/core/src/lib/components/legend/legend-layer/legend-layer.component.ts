import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LegendInfoModel } from '../models/legend-info.model';
import { LegendImageModel } from '@tailormap-viewer/shared';
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
    return {
      url: selectedStyle?.legendUrl ?? legendInfo.url,
      serverType: legendInfo.layer.service?.serverType ?? ServerType.GENERIC,
      legendType: legendInfo.layer.legendType ?? 'static',
      title: legendInfo.layer.title,
    };
  }
}
