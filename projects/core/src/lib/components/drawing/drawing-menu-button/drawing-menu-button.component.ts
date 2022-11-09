import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-drawing-menu-button',
  templateUrl: './drawing-menu-button.component.html',
  styleUrls: ['./drawing-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);
  public panelTitle = $localize `Drawing`;

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.DRAWING);
  }

  public toggleDrawingPanel() {
    this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.DRAWING, this.panelTitle);
  }

}
