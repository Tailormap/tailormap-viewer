import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  @Input()
  public tiles3DLayerIds: string[] = [];

  @Input()
  public filteredLayerIds: string[] = [];

  @Output()
  public zoomToScale = new EventEmitter<number>();

  public isLevel() {
    return this.node?.type === 'level';
  }

  public isLayerHiddenOnMap() {
    return !this.isInScale() || this.isLayerHiddenIn2d();
  }

  public isInScale() {
    return ScaleHelper.isInScale(this.scale, this.node?.metadata?.minScale, this.node?.metadata?.maxScale);
  }

  public isLayerHiddenIn2d() {
    return !this.in3D && this.tiles3DLayerIds.includes(this.node?.id || '');
  }

  public isLayerHiddenIn3d() {
    return this.in3D && this.layersWithoutWebMercator.includes(this.node?.id || '');
  }

  public isLayerFiltered() {
    return this.filteredLayerIds.includes(this.node?.id || '');
  }

  public zoomToLayer($event: MouseEvent, node: TreeModel<AppLayerModel>) {
    $event.stopPropagation();
    const scales: number[] = [];
    if (typeof node?.metadata?.minScale === 'number') {
      scales.push(node?.metadata?.minScale);
    }
    if (typeof node?.metadata?.maxScale === 'number') {
      scales.push(node?.metadata?.maxScale);
    }
    if (scales.length === 0) {
      return;
    }
    const zoomToScale = Math.min(...scales);
    this.zoomToScale.emit(zoomToScale);
  }

}
