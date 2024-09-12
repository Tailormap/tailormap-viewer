import { Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFeatureSources, selectFeatureTypesForSource } from '../state/catalog.selectors';
import { Observable, of, Subject, takeUntil, tap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FormControl, FormGroup } from '@angular/forms';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { GeoServiceHelper } from '../helpers/geo-service.helper';
import { FeatureSourceProtocolEnum } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-feature-type-selector',
  templateUrl: './feature-type-selector.component.html',
  styleUrls: ['./feature-type-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeSelectorComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  public featureSources$: Observable<ExtendedFeatureSourceModel[]> = of([]);
  public featureTypes$: Observable<ExtendedFeatureTypeModel[]> = of([]);

  private _featureSourceId: string | null = null;
  private _featureTypeName: string | null | undefined;

  private prevFeatureSourceId: string | null | undefined = null;
  private prevFeatureTypeName: string | null | undefined = null;

  @Input()
  public set featureSourceId(featureSourceId: number | string | null | undefined) {
    this._featureSourceId = TypesHelper.isDefined(featureSourceId) ? `${featureSourceId}` : null;
    this.prevFeatureSourceId = this._featureSourceId;
    this.featureTypeSelectorForm.patchValue({
      featureSourceId: this._featureSourceId,
    });
    this.showFeatureTypesForSource(this._featureSourceId);
  }

  @Input()
  public set featureTypeName(featureTypeName: string | null | undefined) {
    this._featureTypeName = featureTypeName;
    this.prevFeatureTypeName = this._featureTypeName;
    this.featureTypeSelectorForm.patchValue({ featureTypeName });
  }

  @Input()
  public layerName: string | null | undefined;

  @Input()
  public set disabled(disabled: boolean) {
    if (disabled) {
      this.featureTypeSelectorForm.get('featureSourceId')?.disable({ emitEvent: false });
      this.featureTypeSelectorForm.get('featureTypeName')?.disable({ emitEvent: false });
    } else {
      this.featureTypeSelectorForm.get('featureSourceId')?.enable({ emitEvent: false });
      this.featureTypeSelectorForm.get('featureTypeName')?.enable({ emitEvent: false });
    }
  }

  @Input({transform: (inputValues: string[] | null | undefined) => {
    if (inputValues instanceof Array){
      return inputValues.map(
        excludedFeatureSourceProtocol => FeatureSourceProtocolEnum[excludedFeatureSourceProtocol as keyof typeof FeatureSourceProtocolEnum]
      );
    } else {
      return inputValues;
    }
  }})
  public excludedFeatureSourceProtocols: FeatureSourceProtocolEnum[] | null | undefined;

  @Output()
  public featureTypeSelected = new EventEmitter<{ featureSourceId?: number; featureTypeName?: string; featureTypeId?: string }>();

  public featureTypeSelectorForm = new FormGroup({
    featureSourceId: new FormControl<string | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  });

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.featureSources$ = this.store$.select(selectFeatureSources)
      .pipe(
        map(sources => sources.filter(
          source => !this.excludedFeatureSourceProtocols?.some(excludedType => excludedType === source.protocol),
        )),
      );
    this.featureTypeSelectorForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        withLatestFrom(this.featureTypes$),
      )
      .subscribe(([ value, featureTypes ]) => {
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
          featureTypeId: TypesHelper.isDefined(value.featureTypeName)
            ? featureTypes.find(f => f.name === value.featureTypeName)?.originalId
            : undefined,
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
