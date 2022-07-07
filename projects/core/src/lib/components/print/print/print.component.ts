import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { MenubarService } from '../../menubar';
import { PRINT_ID } from '../print-identifier';
import { PrintMenuButtonComponent } from '../print-menu-button/print-menu-button.component';

@Component({
  selector: 'tm-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private menubarService: MenubarService,
  ) {}

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(PRINT_ID);
    this.menubarService.registerComponent(PrintMenuButtonComponent);
  }
}
