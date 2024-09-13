import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeatureSourceProtocolEnum, SearchIndexModel } from '@tailormap-admin/admin-api';
import { debounceTime, filter, map, distinctUntilChanged, concatMap, forkJoin, of, take } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TypesHelper } from '@tailormap-viewer/shared';
import { selectFeatureTypeBySourceIdAndName } from '../../catalog/state/catalog.selectors';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';

@Component({
  selector: 'tm-admin-search-index-form',
  templateUrl: './search-index-form.component.html',
  styleUrls: ['./search-index-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexFormComponent implements OnInit {

  private _searchIndex: SearchIndexModel | null = null;

  public nonSearchableFeatureSourceProtocols: FeatureSourceProtocolEnum[] = [FeatureSourceProtocolEnum.WFS];

  @Input()
  public set searchIndex(form: SearchIndexModel | null) {
    this._searchIndex = form;
    this.initForm(form);
  }
  public get searchIndex(): SearchIndexModel | null {
    return this._searchIndex;
  }

  @Output()
  public updateSearchIndex = new EventEmitter<{ searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> }>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private destroyRef: DestroyRef,
  ) {
  }

  public searchIndexForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    comment: new FormControl(''),
    featureSourceId: new FormControl<number | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  });

  public ngOnInit(): void {
    this.searchIndexForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(validForm => {
        this.validFormChanged.emit(validForm);
      });
    this.searchIndexForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
        concatMap(validForm => {
          const featureType$ = validForm.featureSourceId && validForm.featureTypeName
            ? this.store$.select(selectFeatureTypeBySourceIdAndName(`${validForm.featureSourceId}`, validForm.featureTypeName))
              .pipe(take(1))
            : of(null);
          return forkJoin([ of(validForm), featureType$ ]);
        }),
      )
      .subscribe(([ value, featureType ]) => {
        const searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> = {
          name: value.name || '',
          featureTypeId: featureType ? +featureType.originalId : -1,
          comment: value.comment || '',
        };
        this.updateSearchIndex.emit({ searchIndex });
      });
  }

  public updateFeatureTypeSelection($event: { featureSourceId?: number; featureTypeName?: string }) {
    if (TypesHelper.isDefined($event.featureSourceId) && TypesHelper.isDefined($event.featureTypeName)) {
      this.searchIndexForm.patchValue({
        featureSourceId: $event.featureSourceId,
        featureTypeName: $event.featureTypeName,
      });
      return;
    }
    this.searchIndexForm.patchValue({
      featureSourceId: null,
      featureTypeName: null,
    });
  }

  private initForm(form: SearchIndexModel | null) {
    if (!form) {
      this.searchIndexForm.patchValue({ name: '', comment: '', featureSourceId: null, featureTypeName: '' }, { emitEvent: false });
      return;
    }
    const featureTypeId = form.featureTypeId;
    this.featureSourceService.getFeatureTypes$()
      .pipe(
        take(1),
        map(featureTypes => featureTypes.find(f => f.originalId === `${featureTypeId}`)),
      )
      .subscribe(featureType => {
        this.searchIndexForm.patchValue({
          name: form.name,
          comment: form.comment,
          featureSourceId: featureType ? +featureType.featureSourceId : undefined,
          featureTypeName: featureType?.name,
        }, { emitEvent: false });
      });
  }

  private isValidForm(): boolean {
    const values = this.searchIndexForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidNumberValue(values.featureSourceId)
      && FormHelper.isValidValue(values.featureTypeName)
      && this.searchIndexForm.dirty
      && this.searchIndexForm.valid;
  }

}
