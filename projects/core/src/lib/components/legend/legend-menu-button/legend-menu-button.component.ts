import { Component, OnInit } from '@angular/core';
import { LegendService } from '../services/legend.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-legend-menu-button',
  templateUrl: './legend-menu-button.component.html',
  styleUrls: ['./legend-menu-button.component.css'],
})
export class LegendMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private legendService: LegendService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.legendService.isVisible$();
  }

  public toggleLegend() {
    this.legendService.toggleVisible();
  }

}
