import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from 'projects/core/src/lib/state/core.selectors';

@Component({
  selector: 'tm-mobile-menubar-home-button',
  templateUrl: './mobile-menubar-home-button.component.html',
  styleUrls: ['./mobile-menubar-home-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarHomeButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.MOBILE_MENUBAR_HOME;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.home.home:Home`));
}
