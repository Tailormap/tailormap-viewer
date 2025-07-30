import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentTitle } from '../../../state';

@Component({
  selector: 'tm-info-menu-button',
  templateUrl: './info-menu-button.component.html',
  styleUrls: ['./info-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoMenuButtonComponent {
  public componentType = BaseComponentTypeEnum.INFO;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.info.info:Info`));
  constructor(private store$: Store) {}
}
