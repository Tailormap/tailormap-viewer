import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { TreeModel, HtmlifyComponent, TooltipDirective } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectLayer } from '../../../map';
import { LayerTransparencyComponent } from '../toc-node-details/layer-transparency/layer-transparency.component';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  LayerDescriptionDialogComponent, LayerDescriptionDialogData,
} from '../toc-node-details/layer-description-dialog/layer-description-dialog.component';

@Component({
    selector: 'tm-toc-node-details-mobile',
    templateUrl: './toc-node-details-mobile.component.html',
    styleUrls: ['./toc-node-details-mobile.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ LayerTransparencyComponent, HtmlifyComponent, MatButton, TooltipDirective ],
})
export class TocNodeDetailsMobileComponent {
  private store$ = inject(Store);
  private dialog = inject(MatDialog);


  public layer: AppLayerModel | null | undefined = null;
  public node: TreeModel<AppLayerModel> | null | undefined;

  @Input()
  public set treeNode(value: TreeModel<AppLayerModel> | null | undefined) {
    this.node = value;
    if (value && value.metadata?.id) {
      this.store$.select(selectLayer(value.metadata?.id)).pipe(take(1)).subscribe(layer => this.layer = layer);
    }
  }

  public getLayerTitle(): string {
    return this.layer?.title || this.node?.metadata?.title || this.node?.label || '';
  }

  public openDescription(description: string) {
    return this.dialog.open<LayerDescriptionDialogComponent, LayerDescriptionDialogData>(LayerDescriptionDialogComponent, {
      data: { title: this.getLayerTitle(), description },
      ariaLabelledBy: LayerDescriptionDialogComponent.TITLE_ID,
      width: '90vw',
      maxHeight: '90vh',
      panelClass: 'layer-description-dialog--full-height',
    });
  }

}
