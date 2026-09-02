import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentTitle } from '../../../state';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-info-menu-button',
    templateUrl: './info-menu-button.component.html',
    styleUrls: ['./info-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class InfoMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.INFO;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.info.info:Info`));
}
