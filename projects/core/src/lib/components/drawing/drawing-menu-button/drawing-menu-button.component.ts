import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-drawing-menu-button',
  templateUrl: './drawing-menu-button.component.html',
  styleUrls: ['./drawing-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingMenuButtonComponent {
  public panelTitle = $localize `Drawing`;
  public componentType = BaseComponentTypeEnum.DRAWING;
}
