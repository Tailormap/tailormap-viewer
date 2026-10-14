import { Component, computed, inject, input, output } from '@angular/core';
import { TreeModel, TooltipDirective } from '@tailormap-viewer/shared';
import { AppLayerModel, WmsStyleModel } from '@tailormap-viewer/api';
import { ScaleHelper } from '@tailormap-viewer/map';
import { FilterSourceHelper } from '../../../filter';
import { MatIcon } from '@angular/material/icon';
import { MatListItemMeta } from '@angular/material/list';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { TocNodeDecorationService } from '../services/toc-node-decoration.service';

@Component({
    selector: 'tm-toc-node-layer',
    templateUrl: './toc-node-layer.component.html',
    styleUrls: ['./toc-node-layer.component.css'],
    imports: [
        MatIcon,
        TooltipDirective,
        MatListItemMeta,
        MatRadioGroup,
        MatRadioButton,
    ],
})
export class TocNodeLayerComponent {

  private tocNodeDecorationService = inject(TocNodeDecorationService);

  public node = input<TreeModel<AppLayerModel> | null>(null);
  public scale = input<number | null>(null);
  public in3D = input<boolean>(false);
  public layersWithoutWebMercator = input<string[]>([]);
  public tiles3DLayerIds = input<string[]>([]);
  public filteredLayerIdsWithSource = input<{ id: string; source: string }[]>([]);
  public editableLayerIds = input<string[]>([]);
  public showInfoIcon = input<boolean>(false);

  public zoomToScale = output<number>();
  public editLayer = output<string>();
  public changeStyle = output<{ layerId: string; selectedStyle: WmsStyleModel }>();
  public showInfo = output<TreeModel<AppLayerModel>>();

  protected decoration = computed(() => this.tocNodeDecorationService.getDecoration(this.node()));

  protected isLevel = computed(() => this.node()?.type === 'level');

  protected isInScale = computed(() => {
    const node = this.node();
    return ScaleHelper.isInScale(this.scale(), node?.metadata?.minScale, node?.metadata?.maxScale);
  });

  protected isLayerHiddenIn2d = computed(() => !this.in3D() && this.tiles3DLayerIds().includes(this.node()?.id || ''));

  protected isLayerHiddenIn3d = computed(() => this.in3D() && this.layersWithoutWebMercator().includes(this.node()?.id || ''));

  protected isLayerHiddenOnMap = computed(() => !this.isInScale() || this.isLayerHiddenIn2d());

  protected isLayerEditable = computed(() => this.editableLayerIds().includes(this.node()?.id || ''));

  protected filterSourceInfo = computed(() => {
    const nodeId = this.node()?.id;
    const filteredLayer = this.filteredLayerIdsWithSource().find(l => l.id === nodeId);
    if (!filteredLayer) {
      return null;
    }
    return FilterSourceHelper.getFilterInfoBySource().get(filteredLayer.source) ?? {
      icon: 'components_filter',
      tooltip: $localize`:@@core.toc.filtered-layer:A filter is applied to this layer`,
    };
  });

  protected hasStylesToShow = computed(() => (this.node()?.metadata?.styles?.length ?? 0) > 1);

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

  public editLayerClicked($event: MouseEvent, node: TreeModel<AppLayerModel>) {
    $event.stopPropagation();
    this.editLayer.emit(node.id);
  }

  protected styleChanged(style: WmsStyleModel) {
    this.changeStyle.emit({ layerId: this.node()?.id || '', selectedStyle: style });
  }

  public emitShowInfo($event: MouseEvent) {
    $event.stopPropagation();
    const node = this.node();
    if (node) {
      this.showInfo.emit(node);
    }
  }

}
