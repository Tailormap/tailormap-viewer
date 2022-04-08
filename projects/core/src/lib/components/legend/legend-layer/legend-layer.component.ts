import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppLayerModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend-layer',
  templateUrl: './legend-layer.component.html',
  styleUrls: ['./legend-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendLayerComponent implements OnInit {

  @Input()
  public layer: AppLayerModel | null = null;

  @Input()
  public url: string | null = null;

  public failedToLoadMessage = $localize `Failed to load legend for`;

  constructor() {}

  public ngOnInit(): void {
  }

}
