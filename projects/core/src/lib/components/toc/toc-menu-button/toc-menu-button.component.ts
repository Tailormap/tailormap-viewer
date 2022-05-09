import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { TOC_ID } from '../toc-identifier';
import { $localize } from '@angular/localize/init';

@Component({
  selector: 'tm-toc-menu-button',
  templateUrl: './toc-menu-button.component.html',
  styleUrls: ['./toc-menu-button.component.css'],
})
export class TocMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private menubarService: MenubarService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(TOC_ID);
  }

  public toggleToc() {
    this.menubarService.toggleActiveComponent(TOC_ID, $localize `Available layers`);
  }

}
