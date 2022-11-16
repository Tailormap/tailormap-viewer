import { Component } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend-menu-button',
  templateUrl: './legend-menu-button.component.html',
  styleUrls: ['./legend-menu-button.component.css'],
})
export class LegendMenuButtonComponent {
  public panelTitle = $localize `Legend`;
  public componentType = BaseComponentTypeEnum.LEGEND;
}
