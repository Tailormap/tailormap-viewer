import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-catalog-node-details',
  templateUrl: './catalog-node-details.component.html',
  styleUrls: ['./catalog-node-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogNodeDetailsComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
