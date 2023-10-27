import { Component } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentTitle } from '../../../state/core.selectors';

@Component({
  selector: 'tm-toc-menu-button',
  templateUrl: './toc-menu-button.component.html',
  styleUrls: ['./toc-menu-button.component.css'],
})
export class TocMenuButtonComponent {
  public componentType = BaseComponentTypeEnum.TOC;
  public panelLabel$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.toc.available-layers:Available layers`));
  constructor(private store$: Store) {}
}
