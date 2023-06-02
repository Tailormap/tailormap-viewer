import { Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFeatureSourceLoadStatus, selectFeatureSources, selectFeatureTypesForSource } from '../state/catalog.selectors';
import { map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { LoadingStateEnum, TypesHelper } from '@tailormap-viewer/shared';
import { loadFeatureSources } from '../state/catalog.actions';
import { FormControl, FormGroup } from '@angular/forms';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { GeoServiceHelper } from '../helpers/geo-service.helper';

@Component({
  selector: 'tm-admin-feature-type-selector',
  templateUrl: './feature-type-selector.component.html',
  styleUrls: ['./feature-type-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeSelectorComponent implements OnInit, OnDestroy {

  private featureSourceLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  private destroyed = new Subject();
  public isLoading$: Observable<boolean> = of(false);

  public featureSources$: Observable<ExtendedFeatureSourceModel[]> = of([]);
  public featureTypes$: Observable<ExtendedFeatureTypeModel[]> = of([]);

  private _featureSourceId: string | null = null;
  private _featureTypeName: string | null | undefined;

  private prevFeatureSourceId: string | null | undefined = null;
  private prevFeatureTypeName: string | null | undefined = null;

  @Input()
  public set featureSourceId(featureSourceId: number | string | null | undefined) {
    this._featureSourceId = TypesHelper.isDefined(featureSourceId) ? `${featureSourceId}` : null;
    this.featureTypeSelectorForm.patchValue({
      featureSourceId: this._featureSourceId,
    });
    this.showFeatureTypesForSource(this._featureSourceId);
  }

  @Input()
  public set featureTypeName(featureTypeName: string | null | undefined) {
    this._featureTypeName = featureTypeName;
    this.featureTypeSelectorForm.patchValue({ featureTypeName });
  }

  @Input()
  public layerName: string | null | undefined;

  @Output()
  public featureTypeSelected = new EventEmitter<{ featureSourceId?: number; featureTypeName?: string }>();

  public featureTypeSelectorForm = new FormGroup({
    featureSourceId: new FormControl<string | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  });

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.featureSources$ = this.store$.select(selectFeatureSources);
    this.featureSourceLoadStatus$ = this.store$.select(selectFeatureSourceLoadStatus);
    this.isLoading$ = this.featureSourceLoadStatus$.pipe(map(status => status === LoadingStateEnum.LOADING));
    this.featureSourceLoadStatus$
      .pipe(take(1))
      .subscribe((status) => {
        if (status !== LoadingStateEnum.LOADED && status !== LoadingStateEnum.LOADING) {
          this.store$.dispatch(loadFeatureSources());
        }
      });
    this.featureTypeSelectorForm.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe((value) => {
        if (!this.changedSinceLastEmit(value.featureSourceId, value.featureTypeName)) {
          return;
        }
        if (!TypesHelper.isDefined(value.featureSourceId)) {
          this.featureTypeSelected.emit({
            featureSourceId: undefined,
            featureTypeName: undefined,
          });
          return;
        }
        this.featureTypeSelected.emit({
          featureSourceId: +(value.featureSourceId),
          featureTypeName: TypesHelper.isDefined(value.featureTypeName) ? value.featureTypeName : undefined,
        });
      });
    const featureSourceControl = this.featureTypeSelectorForm.get('featureSourceId');
    if (featureSourceControl) {
      featureSourceControl.valueChanges
        .pipe(takeUntil(this.destroyed))
        .subscribe((value) => {
          if (!TypesHelper.isDefined(value) || this.prevFeatureSourceId === value) {
            return;
          }
          this.featureTypeSelectorForm.patchValue({ featureTypeName: null });
          this.showFeatureTypesForSource(value);
        });
    }
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private changedSinceLastEmit(featureSourceId: string | null | undefined, featureTypeName: string | null | undefined) {
    if (this.prevFeatureSourceId !== featureSourceId || this.prevFeatureTypeName !== featureTypeName) {
      this.prevFeatureSourceId = featureSourceId;
      this.prevFeatureTypeName = featureTypeName;
      return true;
    }
    return false;
  }

  private showFeatureTypesForSource(featureSourceId: string | null) {
    if (featureSourceId === null) {
      return;
    }
    this.featureTypes$ = this.store$.select(selectFeatureTypesForSource(featureSourceId))
      .pipe(
        tap(featureTypes => {
          if (this.featureTypeSelectorForm.get('featureTypeName')?.value || !this.layerName) {
            return;
          }
          const possibleFeatureType = GeoServiceHelper.findPossibleFeatureType(this.layerName, featureTypes);
          if (possibleFeatureType) {
            this.featureTypeSelectorForm.patchValue({ featureTypeName: possibleFeatureType.name });
          }
        }),
      );
  }
}
