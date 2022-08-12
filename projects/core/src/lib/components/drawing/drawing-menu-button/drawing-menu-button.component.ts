import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { DRAWING_ID } from '../drawing-identifier';

@Component({
  selector: 'tm-drawing-menu-button',
  templateUrl: './drawing-menu-button.component.html',
  styleUrls: ['./drawing-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(DRAWING_ID);
  }

  public toggleDrawingPanel() {
    this.menubarService.toggleActiveComponent(DRAWING_ID, $localize `Drawing`);
  }

}
