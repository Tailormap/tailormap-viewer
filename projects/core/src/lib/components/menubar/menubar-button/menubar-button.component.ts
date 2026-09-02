import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatMenuPanel, MatMenuTrigger } from '@angular/material/menu';
import { MenubarService } from '../menubar.service';
import { MatIconButton } from '@angular/material/button';
import { TooltipDirective } from '../../../../../../shared/src/lib/directives/tooltip.directive';
import { MatBadge } from '@angular/material/badge';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-menubar-button',
    templateUrl: './menubar-button.component.html',
    styleUrls: ['./menubar-button.component.css'],
    imports: [
        MatIconButton,
        TooltipDirective,
        MatBadge,
        MatIcon,
        MatMenuTrigger,
        AsyncPipe,
    ],
})
export class MenubarButtonComponent implements OnInit {

  @Input()
  public icon = '';

  @Input()
  public menuTrigger: MatMenuPanel | null = null;

  @Input()
  public tooltip: string | undefined | null;

  @Input()
  public panelTitle: string | undefined | null;

  @Input()
  public component: string | undefined;

  @Input()
  public active$: Observable<boolean> = of(false);

  @Input()
  public badgeCount: number | null = null;

  @Output()
  public buttonClicked = new EventEmitter();

  private menubarService = inject(MenubarService);

  public ngOnInit(): void {
    if (!this.component) {
      return;
    }
    this.active$ = this.menubarService.isComponentVisible$(this.component);
  }

  public handleClick() {
    if (this.component && this.panelTitle) {
      this.menubarService.toggleActiveComponent(this.component, this.panelTitle);
    }
    this.buttonClicked.emit();
  }

}
