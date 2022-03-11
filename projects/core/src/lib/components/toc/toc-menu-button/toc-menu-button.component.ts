import { Component, OnInit } from '@angular/core';
import { TocService } from '../services/toc.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-toc-menu-button',
  templateUrl: './toc-menu-button.component.html',
  styleUrls: ['./toc-menu-button.component.css'],
})
export class TocMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private tocService: TocService,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.tocService.isVisible$();
  }

  public toggleToc() {
    this.tocService.toggleVisible();
  }

}
