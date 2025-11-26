import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';
import { FeatureSourceFormDialogComponent } from '../feature-source-form-dialog/feature-source-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectCatalogRootNodeId } from '../state/catalog.selectors';
import { CatalogRouteHelper } from '../helpers/catalog-route.helper';
import { Router } from '@angular/router';
import { expandTree } from '../state/catalog.actions';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-catalog-create-buttons',
  templateUrl: './catalog-create-buttons.component.html',
  styleUrls: ['./catalog-create-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CatalogCreateButtonsComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private store$ = inject(Store);
  private router = inject(Router);
  private adminSnackbarService = inject(AdminSnackbarService);


  @Input()
  public node: ExtendedCatalogNodeModel | null = null;

  private destroyed = new Subject();

  private rootNodeId: string | null = null;

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
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(node => {
      if (node) {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.folder-created:Folder ${node.title} created`);
        this.store$.dispatch(expandTree({ id: node.id, nodeType: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE }));
        this.router.navigateByUrl(CatalogRouteHelper.getCatalogNodeUrl({ id: node.id }));
      }
    });
  }

  public addGeoService() {
    const parentNode = this.node ? this.node.id : this.rootNodeId;
    if (parentNode === null) {
      return;
    }
    GeoServiceFormDialogComponent.open(this.dialog, {
      geoService: null,
      parentNode,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(createdService => {
      if (createdService) {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.service-created:Service ${createdService.title} created`);
        this.store$.dispatch(expandTree({ id: createdService.id, nodeType: CatalogTreeModelTypeEnum.SERVICE_TYPE }));
        this.router.navigateByUrl(CatalogRouteHelper.getGeoServiceUrl({ id: createdService.id, catalogNodeId: parentNode }));
      }
    });
  }

  public addFeatureSource() {
    const parentNode = this.node ? this.node.id : this.rootNodeId;
    if (parentNode === null) {
      return;
    }
    FeatureSourceFormDialogComponent.open(this.dialog, {
      featureSource: null,
      parentNode,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(featureSource => {
      if (featureSource) {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.feature-source-created:Feature source ${featureSource.title} created`);
        this.store$.dispatch(expandTree({ id: featureSource.id, nodeType: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE }));
        this.router.navigateByUrl(CatalogRouteHelper.getFeatureSourceUrl({ id: featureSource.id, catalogNodeId: parentNode }));
      }
    });
  }

}
