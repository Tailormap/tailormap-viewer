import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { TOC_ID } from '../toc-identifier';


@Component({
  selector: 'tm-toc-menu-button',
  templateUrl: './toc-menu-button.component.html',
  styleUrls: ['./toc-menu-button.component.css'],
})
export class TocMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);
  public panelLabel = $localize `Available layers`;

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(TOC_ID);
  }

  public toggleToc() {
    this.menubarService.toggleActiveComponent(TOC_ID, this.panelLabel);
  }

}
