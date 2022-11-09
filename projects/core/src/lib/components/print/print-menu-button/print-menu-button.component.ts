import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-print-menu-button',
  templateUrl: './print-menu-button.component.html',
  styleUrls: ['./print-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);
  public panelTitle = $localize `Print`;

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.PRINT);
  }

  public togglePrint() {
    this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.PRINT, this.panelTitle);
  }

}
