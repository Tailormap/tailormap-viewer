import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatMenuPanel, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'tm-menubar-button',
  templateUrl: './menubar-button.component.html',
  styleUrls: ['./menubar-button.component.css'],
})
export class MenubarButtonComponent {

  @Input()
  public icon: string = '';

  @Input()
  public menuTrigger: MatMenuPanel | null = null;

  @Input()
  public tooltip$: Observable<string> = of('');

  @Input()
  public active$: Observable<boolean> = of(false);

  @Output()
  public buttonClicked = new EventEmitter();

  public handleClick() {
    this.buttonClicked.emit();
  }

}
