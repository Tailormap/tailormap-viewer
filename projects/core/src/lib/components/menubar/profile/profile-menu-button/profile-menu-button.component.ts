import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../../state';

@Component({
  selector: 'tm-profile-menu-button',
  templateUrl: './profile-menu-button.component.html',
  styleUrls: ['./profile-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProfileMenuButtonComponent {
  private store$ = inject(Store);
  public componentType = BaseComponentTypeEnum.PROFILE;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.profile:Profile`));
}
