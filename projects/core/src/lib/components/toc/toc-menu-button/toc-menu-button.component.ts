import { Component } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-toc-menu-button',
  templateUrl: './toc-menu-button.component.html',
  styleUrls: ['./toc-menu-button.component.css'],
})
export class TocMenuButtonComponent {
  public panelLabel = $localize `:@@core.toc.available-layers:Available layers`;
  public componentType = BaseComponentTypeEnum.TOC;
}
