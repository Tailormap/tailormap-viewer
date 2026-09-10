import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../../state';
import { MenubarButtonComponent } from '../../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-clicked-coordinates-menu-button',
    templateUrl: './clicked-coordinates-menu-button.component.html',
    styleUrls: ['./clicked-coordinates-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ MenubarButtonComponent, AsyncPipe ],
})
export class ClickedCoordinatesMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.COORDINATE_PICKER;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.coordinate-picker:Coordinate Picker`));
}
