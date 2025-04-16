import {
  Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef,
} from '@angular/core';
import { BrowserHelper } from '@tailormap-viewer/shared';
import { BehaviorSubject, map } from 'rxjs';
import { LayerTreeNodeWithLayerModel } from '../../../map/models/layer-tree-node-with-layer.model';

@Component({
  selector: 'tm-toc-node-details',
  templateUrl: './toc-node-details.component.html',
  styleUrls: ['./toc-node-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TocNodeDetailsComponent implements OnInit {

  @Input()
  public node: LayerTreeNodeWithLayerModel | null | undefined = null;

  @Output()
  public closeDetails = new EventEmitter<void>();

  @ViewChild('detailsPanel', { static: false, read: ElementRef })
  private detailsPanel: ElementRef | undefined;

  private panelHeightSubject = new BehaviorSubject<number | undefined>(undefined);
  public panelHeight$ = this.panelHeightSubject.asObservable().pipe(map(height => height ? `${height}px` : undefined));

  public ngOnInit(): void {
    this.updateHeight();
  }

  public panelResized(delta: number) {
    this.updateHeight(delta);
  }

  private updateHeight(delta?: number) {
    const el = this.detailsPanel?.nativeElement as HTMLElement;
    if (!el) {
      return;
    }
    const MIN_HEIGHT = 90;
    const MIN_TOC_TREE_HEIGHT = 100;
    // some pretty specific TOC logic, since this panel is intended as part of TOC.
    // if inside TOC panel, max height is panel height - toc tree height, else max height 80vh
    const parentPanel = el.closest<HTMLElement>('.dialog-content');
    const tocHeader = el.querySelector<HTMLElement>('.toc-header');
    const MAX_HEIGHT = parentPanel && tocHeader
      ? parentPanel.offsetHeight - tocHeader.offsetHeight - MIN_TOC_TREE_HEIGHT
      : BrowserHelper.getScreenHeight() * 0.8;
    const panelHeight = Math.max(MIN_HEIGHT, Math.min(el.offsetHeight - (delta || 0), MAX_HEIGHT));
    this.panelHeightSubject.next(panelHeight);
  }

  public close() {
    this.closeDetails.emit();
  }

}
