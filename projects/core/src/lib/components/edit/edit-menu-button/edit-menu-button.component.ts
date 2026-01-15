import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state';

@Component({
  selector: 'tm-edit-menu-button',
  templateUrl: './edit-menu-button.component.html',
  styleUrls: ['./edit-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.EDIT;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.edit.edit:Edit`));
}
