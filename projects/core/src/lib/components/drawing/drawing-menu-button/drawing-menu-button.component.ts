import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentTitle } from '../../../state/core.selectors';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-drawing-menu-button',
    templateUrl: './drawing-menu-button.component.html',
    styleUrls: ['./drawing-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class DrawingMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.DRAWING;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.drawing.drawing:Drawing`));
}
