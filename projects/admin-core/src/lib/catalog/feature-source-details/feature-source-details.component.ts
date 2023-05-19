import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceUpdateModel } from '../models/feature-source-update.model';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectFeatureSourceById } from '../state/catalog.selectors';
import { FeatureSourceService } from '../services/feature-source.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

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

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private adminSnackbarService: AdminSnackbarService,
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

  public updateFeatureSource($event: FeatureSourceUpdateModel) {
    this.updatedFeatureSource = $event;
  }

  public save(featureSourceId: string) {
    if (!this.updatedFeatureSource) {
      return;
    }
    this.savingSubject.next(true);
    this.featureSourceService.updateFeatureSource$(
      featureSourceId,
      this.updatedFeatureSource,
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(success => {
        if (success) {
          this.adminSnackbarService.showMessage($localize `Feature source updated`);
          this.updatedFeatureSource = null;
        }
        this.savingSubject.next(false);
      });
  }

}
