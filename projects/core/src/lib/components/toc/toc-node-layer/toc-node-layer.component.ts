import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel, WmsStyleModel } from '@tailormap-viewer/api';
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

  @Input()
  public editableLayerIds: string[] = [];

  @Input()
  public showInfoIcon: boolean = false;

  @Output()
  public zoomToScale = new EventEmitter<number>();

  @Output()
  public editLayer = new EventEmitter<string>();

  @Output()
  public changeStyle = new EventEmitter<{ layerId: string; selectedStyle: WmsStyleModel }>();

  @Output()
  public showInfo= new EventEmitter<TreeModel<AppLayerModel>>();

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

  public isLayerEditable() {
    return this.editableLayerIds.includes(this.node?.id || '');
  }

  public zoomToLayer($event: MouseEvent, node: TreeModel<AppLayerModel>) {
    $event.stopPropagation();
    const scales: number[] = [];
    if (typeof node?.metadata?.minScale === 'number') {
      scales.push(node?.metadata?.minScale * 1.001);
    }
    if (typeof node?.metadata?.maxScale === 'number') {
      scales.push(node?.metadata?.maxScale * 0.999);
    }
    if (scales.length === 0) {
      return;
    }
    const zoomToScale = Math.min(...scales);
    this.zoomToScale.emit(zoomToScale);
  }

  public editLayerClicked(node: TreeModel<AppLayerModel>) {
    this.editLayer.emit(node.id);
  }

  protected hasStyles() {
    return !!this.node?.metadata?.styles && this.node.metadata.styles.length > 0;
  }

  protected styleChanged(style: WmsStyleModel) {
    this.changeStyle.emit({ layerId: this.node?.id || '', selectedStyle: style });
  }

  public emitShowInfo() {
    if (this.node) {
      this.showInfo.emit(this.node);
    }
  }

}
