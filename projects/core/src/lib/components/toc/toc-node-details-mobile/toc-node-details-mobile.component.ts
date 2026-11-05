import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { TreeModel, MarkdownToHtmlPipe } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectLayer } from '../../../map';
import { LayerTransparencyComponent } from '../toc-node-details/layer-transparency/layer-transparency.component';
import { LAYER_DESCRIPTION_MARKDOWN_OPTIONS } from '../toc-node-details/layer-description-markdown-options';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-toc-node-details-mobile',
    templateUrl: './toc-node-details-mobile.component.html',
    styleUrls: ['./toc-node-details-mobile.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ LayerTransparencyComponent, MarkdownToHtmlPipe, AsyncPipe ],
})
export class TocNodeDetailsMobileComponent {
  private store$ = inject(Store);


  public descriptionOptions = LAYER_DESCRIPTION_MARKDOWN_OPTIONS;
  public layer: AppLayerModel | null | undefined = null;
  public node: TreeModel<AppLayerModel> | null | undefined;

  @Input()
  public set treeNode(value: TreeModel<AppLayerModel> | null | undefined) {
    this.node = value;
    if (value && value.metadata?.id) {
      this.store$.select(selectLayer(value.metadata?.id)).pipe(take(1)).subscribe(layer => this.layer = layer);
    }
  }

}
