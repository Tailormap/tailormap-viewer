import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-edit-menu-button',
    templateUrl: './edit-menu-button.component.html',
    styleUrls: ['./edit-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MenubarButtonComponent, AsyncPipe],
})
export class EditMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.EDIT;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.edit.edit:Edit`));
}
