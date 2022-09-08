import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';

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
    this.visible$ = this.menubarService.isComponentVisible$(PRINT_ID);
  }

  public togglePrint() {
    this.menubarService.toggleActiveComponent(PRINT_ID, this.panelTitle);
  }

}
