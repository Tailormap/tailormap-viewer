import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
  standalone: false,
})
export class CatalogNodeFormDialogComponent {
  public data = inject<CatalogNodeFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<CatalogNodeFormDialogComponent, CatalogNodeModel | null>>(MatDialogRef);
  private catalogService = inject(CatalogService);

  public node: Omit<ExtendedCatalogNodeModel, 'id'> | null = null;

  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

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

  public updateNode($event: Omit<ExtendedCatalogNodeModel, 'id'> | null) {
    this.node = $event;
  }

}
