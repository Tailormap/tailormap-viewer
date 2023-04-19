import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input } from '@angular/core';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';
import { FeatureSourceFormDialogComponent } from '../feature-source-form-dialog/feature-source-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectCatalogRootNodeId } from '../state/catalog.selectors';

@Component({
  selector: 'tm-admin-catalog-create-buttons',
  templateUrl: './catalog-create-buttons.component.html',
  styleUrls: ['./catalog-create-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogCreateButtonsComponent implements OnInit, OnDestroy {

  @Input()
  public node: ExtendedCatalogNodeModel | null = null;

  private destroyed = new Subject();

  private rootNodeId: string | null = null;

  constructor(
    private dialog: MatDialog,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.store$.select(selectCatalogRootNodeId)
      .pipe(takeUntil(this.destroyed))
      .subscribe(rootNodeId => this.rootNodeId = rootNodeId);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public addCatalogNode() {
    const parentNode = this.node ? this.node.id : this.rootNodeId;
    if (parentNode === null) {
      return;
    }
    CatalogNodeFormDialogComponent.open(this.dialog, {
      node: null,
      parentNode,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe();
  }

  public addGeoService() {
    const parentNode = this.node ? this.node.id : this.rootNodeId;
    if (parentNode === null) {
      return;
    }
    GeoServiceFormDialogComponent.open(this.dialog, {
      geoService: null,
      parentNode,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe();
  }

  public addFeatureSource() {
    const parentNode = this.node ? this.node.id : this.rootNodeId;
    if (parentNode === null) {
      return;
    }
    FeatureSourceFormDialogComponent.open(this.dialog, {
      featureSource: null,
      parentNode,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe();
  }

}
