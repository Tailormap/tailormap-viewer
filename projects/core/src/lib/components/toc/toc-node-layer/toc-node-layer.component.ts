import { Component, Input } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { ScaleHelper } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-toc-node-layer',
  templateUrl: './toc-node-layer.component.html',
  styleUrls: ['./toc-node-layer.component.css'],
  standalone: false,
})
export class TocNodeLayerComponent {

  @Input()
  public node: TreeModel<AppLayerModel> | null = null;

  @Input()
  public scale: number | null = null;

  @Input()
  public in3D: boolean = false;

  @Input()
  public layersWithoutWebMercator: string[] = [];

  public isLevel() {
    return this.node?.type === 'level';
  }

  public isLayerHiddenOnMap() {
    return !ScaleHelper.isInScale(this.scale, this.node?.metadata?.minScale, this.node?.metadata?.maxScale)
      || (this.in3D && !this.isLevel() && this.layersWithoutWebMercator.includes(this.node?.id || ''));
  }

}
