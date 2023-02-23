import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { Store } from '@ngrx/store';
import { selectCatalogNodeById } from '../state/catalog.selectors';
import { CatalogService } from '../services/catalog.service';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';

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
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.node$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('nodeId')),
      distinctUntilChanged(),
      filter((nodeId): nodeId is string => !!nodeId),
      switchMap(nodeId => this.store$.select(selectCatalogNodeById(nodeId))),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public addCatalogNode(node: ExtendedCatalogNodeModel) {
    CatalogNodeFormDialogComponent.open(this.dialog, {
      node: null,
      parentNode: node.id,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe();
  }

  public addGeoService(node: ExtendedCatalogNodeModel) {
    GeoServiceFormDialogComponent.open(this.dialog, {
      geoService: null,
      parentNode: node.id,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe();
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
      .subscribe(() => this.savingSubject.next(false));
  }

}
