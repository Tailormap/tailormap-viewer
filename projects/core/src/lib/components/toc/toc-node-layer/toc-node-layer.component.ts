import { Component, Input } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { ScaleHelper } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-toc-node-layer',
  templateUrl: './toc-node-layer.component.html',
  styleUrls: ['./toc-node-layer.component.css'],
})
export class TocNodeLayerComponent {

  @Input()
  public node: TreeModel<AppLayerModel> | null = null;

  @Input()
  public scale: number | null = null;

  constructor() { }

  public isLevel() {
    return this.node?.type === 'level';
  }

  public isLayerOutOfScale() {
    return !ScaleHelper.isInScale(this.scale, this.node?.metadata?.minScale, this.node?.metadata?.maxScale);
  }

}
