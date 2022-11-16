import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatMenuPanel } from '@angular/material/menu';
import { MenubarService } from '../menubar.service';

@Component({
  selector: 'tm-menubar-button',
  templateUrl: './menubar-button.component.html',
  styleUrls: ['./menubar-button.component.css'],
})
export class MenubarButtonComponent implements OnInit {

  @Input()
  public icon = '';

  @Input()
  public menuTrigger: MatMenuPanel | null = null;

  @Input()
  public tooltip: string | undefined;

  @Input()
  public panelTitle: string | undefined;

  @Input()
  public component: string | undefined;

  @Input()
  public tooltip$: Observable<string> | undefined;

  @Input()
  public active$: Observable<boolean> = of(false);

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
