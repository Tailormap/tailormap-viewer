import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';


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
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.TOC);
  }

  public toggleToc() {
    this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.TOC, this.panelLabel);
  }

}
