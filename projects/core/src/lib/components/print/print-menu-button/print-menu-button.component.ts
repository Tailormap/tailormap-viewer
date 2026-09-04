import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';
import { MenubarButtonComponent } from '../../menubar/menubar-button/menubar-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-print-menu-button',
    templateUrl: './print-menu-button.component.html',
    styleUrls: ['./print-menu-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ MenubarButtonComponent, AsyncPipe ],
})
export class PrintMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.PRINT;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.print.print:Print`));
}
