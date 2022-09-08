import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { LEGEND_ID } from '../legend-identifier';

@Component({
  selector: 'tm-legend-menu-button',
  templateUrl: './legend-menu-button.component.html',
  styleUrls: ['./legend-menu-button.component.css'],
})
export class LegendMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);
  public panelTitle = $localize `Legend`;

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(LEGEND_ID);
  }

  public toggleLegend() {
    this.menubarService.toggleActiveComponent(LEGEND_ID, this.panelTitle);
  }

}
