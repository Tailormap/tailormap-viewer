import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-filter-menu-button',
  templateUrl: './filter-menu-button.component.html',
  styleUrls: ['./filter-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterMenuButtonComponent {
  public panelLabel = $localize `Filtering`;
  public componentType = BaseComponentTypeEnum.FILTER;
}
