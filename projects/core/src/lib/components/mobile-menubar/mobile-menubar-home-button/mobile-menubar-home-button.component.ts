import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-mobile-menubar-home-button',
    templateUrl: './mobile-menubar-home-button.component.html',
    styleUrls: ['./mobile-menubar-home-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class MobileMenubarHomeButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.MOBILE_MENUBAR_HOME;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.home.menu:Menu`));
}
