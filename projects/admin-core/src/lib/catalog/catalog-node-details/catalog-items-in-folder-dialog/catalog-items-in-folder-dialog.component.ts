import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExtendedGeoServiceModel } from '../../models/extended-geo-service.model';
import { ExtendedFeatureTypeModel } from '../../models/extended-feature-type.model';
import { ExtendedCatalogNodeModel } from '../../models/extended-catalog-node.model';
import { CatalogModelHelper } from '@tailormap-admin/admin-api';
import { CatalogRouteHelper } from '../../helpers/catalog-route.helper';

@Component({
  selector: 'tm-admin-catalog-items-in-folder-dialog',
  templateUrl: './catalog-items-in-folder-dialog.component.html',
  styleUrls: ['./catalog-items-in-folder-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogItemsInFolderDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<CatalogItemsInFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { node: ExtendedCatalogNodeModel, items: Array<ExtendedGeoServiceModel | ExtendedFeatureTypeModel> },
  ) { }

  public onConfirm() {
    this.dialogRef.close(true);
  }

  public getUrl(item: ExtendedGeoServiceModel | ExtendedFeatureTypeModel) {
    if (CatalogModelHelper.isGeoServiceModel(item)) {
      return CatalogRouteHelper.getGeoServiceUrl({ id: item.id, catalogNodeId: this.data.node.id });
    }
    return CatalogRouteHelper.getFeatureSourceUrl({ id: item.id, catalogNodeId: this.data.node.id });
  }

  public getTitle(item: ExtendedGeoServiceModel | ExtendedFeatureTypeModel) {
    if (CatalogModelHelper.isGeoServiceModel(item)) {
      return item.title;
    }
    return item.title || item.name;
  }

}
