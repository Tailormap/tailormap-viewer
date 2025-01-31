import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-print-menu-button',
  templateUrl: './print-menu-button.component.html',
  styleUrls: ['./print-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PrintMenuButtonComponent {
  public componentType = BaseComponentTypeEnum.PRINT;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.print.print:Print`));
  constructor(private store$: Store) {}
}
