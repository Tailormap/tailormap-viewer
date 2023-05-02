import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogService } from '../services/catalog.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { CatalogNodeModel } from '@tailormap-admin/admin-api';

export interface CatalogNodeFormDialogData {
  node: ExtendedCatalogNodeModel | null;
  parentNode: string;
}

@Component({
  selector: 'tm-admin-catalog-node-form-dialog',
  templateUrl: './catalog-node-form-dialog.component.html',
  styleUrls: ['./catalog-node-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogNodeFormDialogComponent {

  public node: Omit<ExtendedCatalogNodeModel, 'id'> | null = null;

  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CatalogNodeFormDialogData,
    private dialogRef: MatDialogRef<CatalogNodeFormDialogComponent, CatalogNodeModel | null>,
    private catalogService: CatalogService,
  ) {}

  public static open(
    dialog: MatDialog,
    data: CatalogNodeFormDialogData,
  ): MatDialogRef<CatalogNodeFormDialogComponent, CatalogNodeModel | null> {
    return dialog.open(CatalogNodeFormDialogComponent, {
      data,
      width: '500px',
    });
  }

  public cancel() {
    this.dialogRef.close();
  }

  public save() {
    if (!this.node) {
      return;
    }
    this.savingSubject.next(true);
    (this.data.node === null
      ? this.catalogService.createCatalogNode$(this.node)
      : this.catalogService.updateCatalogNode$({ ...this.node, id: this.data.node.id })
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.savingSubject.next(false);
        this.dialogRef.close(result ? result.node : null);
      });
  }

  public updateNode($event: Omit<ExtendedCatalogNodeModel, 'id'>) {
    this.node = $event;
  }

}
