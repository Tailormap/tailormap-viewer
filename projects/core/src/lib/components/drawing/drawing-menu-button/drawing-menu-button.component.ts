import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentTitle } from '../../../state/core.selectors';

@Component({
  selector: 'tm-drawing-menu-button',
  templateUrl: './drawing-menu-button.component.html',
  styleUrls: ['./drawing-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingMenuButtonComponent {
  public componentType = BaseComponentTypeEnum.DRAWING;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.drawing.drawing:Drawing`));
  constructor(private store$: Store) {}
}
