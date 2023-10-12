import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-print-menu-button',
  templateUrl: './print-menu-button.component.html',
  styleUrls: ['./print-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintMenuButtonComponent {
  public panelTitle = $localize `:@@core.print.print:Print`;
  public componentType = BaseComponentTypeEnum.PRINT;
}
