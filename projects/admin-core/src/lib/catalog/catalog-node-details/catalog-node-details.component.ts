import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, concatMap, distinctUntilChanged, filter, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { Store } from '@ngrx/store';
import { selectCatalogNodeById } from '../state/catalog.selectors';
import { CatalogService } from '../services/catalog.service';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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

  public updatedNode: ExtendedCatalogNodeModel | null = null;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private catalogService: CatalogService,
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.node$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('nodeId')),
      distinctUntilChanged(),
      filter((nodeId): nodeId is string => !!nodeId),
      concatMap(nodeId => this.store$.select(selectCatalogNodeById(nodeId))),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public addCatalogNode(node: ExtendedCatalogNodeModel) {
    CatalogNodeFormDialogComponent.open(this.dialog, {
      createNew: true,
      node: null,
      parentNode: node.id,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe((newNode: ExtendedCatalogNodeModel | null) => {
      if (newNode) {
        this.catalogService.createCatalogNode$(newNode);
      }
    });
  }

  public updateNode($event: ExtendedCatalogNodeModel) {
    this.updatedNode = $event;
  }

  public save() {
    if (!this.updatedNode) {
      return;
    }
    this.savingSubject.next(true);
    this.catalogService.updateCatalogNode$(this.updatedNode)
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.savingSubject.next(false));
  }

}
