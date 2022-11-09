import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

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
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.LEGEND);
  }

  public toggleLegend() {
    this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.LEGEND, this.panelTitle);
  }

}
