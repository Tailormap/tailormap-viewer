import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { LayerTreeNodeWithLayerModel } from '../../../map/models/layer-tree-node-with-layer.model';

@Component({
  selector: 'tm-toc-node-details-mobile',
  templateUrl: './toc-node-details-mobile.component.html',
  styleUrls: ['./toc-node-details-mobile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TocNodeDetailsMobileComponent {

  @Input()
  public node: LayerTreeNodeWithLayerModel | null | undefined = null;

  constructor() { }

}
