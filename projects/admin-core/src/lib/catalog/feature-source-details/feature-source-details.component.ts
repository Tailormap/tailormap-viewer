import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, concatMap, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap,
} from 'rxjs';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceUpdateModel } from '../models/feature-source-update.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectFeatureSourceById } from '../state/catalog.selectors';
import { FeatureSourceService } from '../services/feature-source.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { FeatureSourceUsedDialogComponent } from './feature-source-used-dialog/feature-source-used-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'tm-admin-feature-source-details',
  templateUrl: './feature-source-details.component.html',
  styleUrls: ['./feature-source-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureSourceDetailsComponent implements OnInit, OnDestroy {

  public featureSource$: Observable<ExtendedFeatureSourceModel | null> = of(null);
  private destroyed = new Subject();
  public updatedFeatureSource: FeatureSourceUpdateModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private refreshingSubject = new BehaviorSubject(false);
  public refreshing$ = this.refreshingSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private adminSnackbarService: AdminSnackbarService,
    private confirmDialog: ConfirmDialogService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.featureSource$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('featureSourceId')),
      distinctUntilChanged(),
      filter((featureSourceId): featureSourceId is string => !!featureSourceId),
      switchMap(featureSourceId => this.store$.select(selectFeatureSourceById(featureSourceId))),
      tap(featureSource => { if (featureSource) { this.updatedFeatureSource = null; }}),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateFeatureSource($event: FeatureSourceUpdateModel | null) {
    this.updatedFeatureSource = $event;
  }

  public save(featureSource: ExtendedFeatureSourceModel) {
    if (!this.updatedFeatureSource) {
      return;
    }
    this.savingSubject.next(true);
    this.featureSourceService.updateFeatureSource$(
      featureSource.id,
      this.updatedFeatureSource,
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(updatedSource => {
        if (updatedSource) {
          this.checkToRefresh(featureSource, updatedSource);
          this.adminSnackbarService.showMessage($localize `Feature source updated`);
          this.updatedFeatureSource = null;
        }
        this.savingSubject.next(false);
      });
  }

  private checkToRefresh(featureSource: ExtendedFeatureSourceModel, updatedFeatureSource?: FeatureSourceModel) {
    if (!updatedFeatureSource || !FormHelper.someValuesChanged([
      [ featureSource.url, updatedFeatureSource.url ],
      [ featureSource.jdbcConnection?.host, updatedFeatureSource.jdbcConnection?.host ],
      [ featureSource.jdbcConnection?.database, updatedFeatureSource.jdbcConnection?.database ],
      [ featureSource.jdbcConnection?.schema, updatedFeatureSource.jdbcConnection?.schema ],
      [ featureSource.jdbcConnection?.port, updatedFeatureSource.jdbcConnection?.port ],
      [ featureSource.authentication?.username, updatedFeatureSource.authentication?.username ],
      [ featureSource.authentication?.password, updatedFeatureSource.authentication?.password ],
    ])) {
      return;
    }
    this.confirmDialog.confirm$(
      $localize `Refresh feature source?`,
      $localize `The settings for the feature source are updated. Do you want to refresh the feature source to refresh the feature types?`,
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        if (result) {
          this.refresh(featureSource.id);
        }
      });
  }

  public refresh(featureSourceId: string) {
    this.refreshingSubject.next(true);
    this.featureSourceService.refreshFeatureSource$(featureSourceId)
      .pipe(takeUntil(this.destroyed))
      .subscribe(success => {
        if (success) {
          this.adminSnackbarService.showMessage($localize `Feature source refreshed`);
        }
        this.refreshingSubject.next(false);
      });
  }

  public deleteFeatureSource(featureSource: ExtendedFeatureSourceModel) {
    this.featureSourceService.getGeoServiceLayersUsingFeatureSource$(featureSource.id)
      .pipe(
        take(1),
        concatMap(layers => {
          if (layers.length > 0) {
            return this.dialog.open(FeatureSourceUsedDialogComponent, { data: { featureSource, layers } })
              .afterClosed().pipe(map((result: boolean | undefined | 'layer-updated') => {
                if (result === 'layer-updated') {
                  return 'layer-updated';
                }
                return false;
              }));
          }
          return this.confirmDialog.confirm$(
            `Delete source ${featureSource.title}`,
            `Are you sure you want to delete feature source ${featureSource.title}? This action cannot be undone.`,
            true,
          );
        }),
        concatMap(confirmed => {
          if (confirmed === 'layer-updated') {
            return of({ success: false, restartFlow: true });
          }
          if (confirmed) {
            return this.featureSourceService.deleteFeatureSource$(featureSource.id, featureSource.catalogNodeId);
          }
          return of({ success: false });
        }),
      )
      .subscribe((response: { success: boolean; restartFlow?: boolean }) => {
        if (!response.success) {
          if (response.restartFlow) {
            this.deleteFeatureSource(featureSource);
          }
          return;
        }
        this.adminSnackbarService.showMessage($localize `Source ${featureSource.title} removed`);
        this.router.navigateByUrl('/catalog');
      });
  }

}
