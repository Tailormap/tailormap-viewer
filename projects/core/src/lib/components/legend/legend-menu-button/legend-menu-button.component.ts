import { Component, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-legend-menu-button',
  templateUrl: './legend-menu-button.component.html',
  styleUrls: ['./legend-menu-button.component.css'],
  standalone: false,
})
export class LegendMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.LEGEND;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.legend.legend:Legend`));
}
