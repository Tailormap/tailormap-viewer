import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-catalog-home',
  templateUrl: './catalog-home.component.html',
  styleUrls: ['./catalog-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogHomeComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
