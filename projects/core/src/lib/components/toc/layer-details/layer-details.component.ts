import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { ExtendedAppLayerModel } from '../../../map/models';
import { BrowserHelper } from '@tailormap-viewer/shared';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { LegendService } from '../../legend/services/legend.service';
import { MapService } from '@tailormap-viewer/map';
import { LegendInfoModel } from '../../legend/models/legend-info.model';

@Component({
  selector: 'tm-layer-details',
  templateUrl: './layer-details.component.html',
  styleUrls: ['./layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerDetailsComponent implements OnInit {

  private legendService = inject(LegendService);
  private mapService = inject(MapService);

  private _layer: ExtendedAppLayerModel | null = null;

  @Input()
  public set layer(layer: ExtendedAppLayerModel | null) {
    this._layer = layer;
    this.updateLegend();
  }
  public get layer(): ExtendedAppLayerModel | null {
    return this._layer;
  }

  @Output()
  public closeDetails = new EventEmitter<void>();

  @ViewChild('detailsPanel', { static: false, read: ElementRef })
  private detailsPanel: ElementRef | undefined;

  private panelHeightSubject = new BehaviorSubject<number | undefined>(undefined);
  public panelHeight$ = this.panelHeightSubject.asObservable().pipe(map(height => height ? `${height}px` : undefined));

  public legendInfo$: Observable<LegendInfoModel | null> = of(null);

  public ngOnInit(): void {
    this.updateHeight();
  }

  public panelResized(delta: number) {
    this.updateHeight(delta);
  }

  private updateLegend() {
    if (!this.layer) {
      return;
    }
    this.legendInfo$ = this.legendService.getLegendInfo$(of([this.layer]), this.mapService.getMapViewDetails$())
      .pipe(map(legendInfo => legendInfo.length !== 0 ? legendInfo[0] : null));
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
