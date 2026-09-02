import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectLayer } from '../../../map';
import { LayerTransparencyComponent } from '../toc-node-details/layer-transparency/layer-transparency.component';
import { HtmlifyPipe } from '../../../../../../shared/src/lib/pipes/htmlify.pipe';

@Component({
    selector: 'tm-toc-node-details-mobile',
    templateUrl: './toc-node-details-mobile.component.html',
    styleUrls: ['./toc-node-details-mobile.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LayerTransparencyComponent, HtmlifyPipe],
})
export class TocNodeDetailsMobileComponent {
  private store$ = inject(Store);


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
