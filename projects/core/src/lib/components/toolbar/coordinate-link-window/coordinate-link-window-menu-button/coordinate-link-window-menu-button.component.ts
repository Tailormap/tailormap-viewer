import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../../state';

@Component({
  selector: 'tm-coordinate-link-window-menu-button',
  templateUrl: './coordinate-link-window-menu-button.component.html',
  styleUrls: ['./coordinate-link-window-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CoordinateLinkWindowMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.COORDINATE_LINK_WINDOW;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.coordinate-link-window:Coordinate Link Window`));
}
