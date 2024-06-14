import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LegendInfoModel } from '../models/legend-info.model';
import { LegendImageModel } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-legend-layer',
  templateUrl: './legend-layer.component.html',
  styleUrls: ['./legend-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendLayerComponent {
  @Input()
  public legendInfo: LegendInfoModel | null = null;
  @Input()
  public showTitle = true;

  public getLegend(legendInfo: LegendInfoModel): LegendImageModel {
    return {
      url: legendInfo.url,
      serverType: legendInfo.layer.service?.serverType ?? 'generic',
      title: legendInfo.layer.title,
    };
  }
}
