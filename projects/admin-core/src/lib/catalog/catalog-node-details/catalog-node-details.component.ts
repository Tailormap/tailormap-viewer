import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject, concatMap, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap,
} from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { Store } from '@ngrx/store';
import { selectCatalogNodeById } from '../state/catalog.selectors';
import { CatalogService } from '../services/catalog.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { CatalogItemsInFolderDialogComponent } from './catalog-items-in-folder-dialog/catalog-items-in-folder-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-catalog-node-details',
  templateUrl: './catalog-node-details.component.html',
  styleUrls: ['./catalog-node-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogNodeDetailsComponent implements OnInit, OnDestroy {

  public node$: Observable<ExtendedCatalogNodeModel | null> = of(null);
  private destroyed = new Subject();

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public updatedNode: Omit<ExtendedCatalogNodeModel, 'id'> | null = null;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private catalogService: CatalogService,
    private adminSnackbarService: AdminSnackbarService,
    private dialog: MatDialog,
    private confirmDialog: ConfirmDialogService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.node$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('nodeId')),
      distinctUntilChanged(),
      filter((nodeId): nodeId is string => !!nodeId),
      switchMap(nodeId => this.store$.select(selectCatalogNodeById(nodeId))),
      tap(node => { if (node) { this.updatedNode = null; }}),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateNode($event: Omit<ExtendedCatalogNodeModel, 'id'>) {
    this.updatedNode = $event;
  }

  public save(nodeId: string) {
    if (!this.updatedNode) {
      return;
    }
    this.savingSubject.next(true);
    this.catalogService.updateCatalogNode$({ ...this.updatedNode, id: nodeId })
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `Node updated`);
        this.savingSubject.next(false);
      });
  }

  public deleteNode(node: ExtendedCatalogNodeModel) {
    this.catalogService.getItemsForCatalogNode$(node)
      .pipe(
        take(1),
        concatMap(items => {
          if (items.length > 0) {
            return this.dialog.open(CatalogItemsInFolderDialogComponent, { data: { node, items } })
              .afterClosed().pipe(map(() => false));
          }
          return this.confirmDialog.confirm$(
            `Delete folder ${node.title}`,
            `Are you sure you want to the folder ${node.title}? This action cannot be undone.`,
            true,
          );
        }),
        concatMap(confirmed => {
          if (confirmed) {
            return this.catalogService.removeNodeFromCatalog$(node);
          }
          return of({ success: false });
        }),
      )
      .subscribe(response => {
        if (!response.success) {
          return;
        }
        this.adminSnackbarService.showMessage($localize `Folder ${node.title} removed`);
        this.router.navigateByUrl('/catalog');
      });
  }

}
